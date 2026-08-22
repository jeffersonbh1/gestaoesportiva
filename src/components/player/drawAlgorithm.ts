import { EquipeMembro, SorteioTimeResultado, TipoAlgoritmoSorteio } from '../../types';

export interface GeneratedTeam {
  name: string;
  members: {
    id: string;
    name: string;
    email?: string;
    rating: number;
  }[];
  averageRating: number;
}

export interface DrawResult {
  teams: GeneratedTeam[];
  waitingList: {
    id: string;
    name: string;
    email?: string;
    rating: number;
  }[];
  algorithm: TipoAlgoritmoSorteio;
  playersPerTeam: number;
  timestamp: string;
}

/**
 * Realiza o sorteio de times com base no algoritmo escolhido
 */
export function executeDraw(
  presentMembers: { id: string; name: string; email?: string; rating: number }[],
  playersPerTeam: number,
  algorithm: TipoAlgoritmoSorteio
): DrawResult {
  const timestamp = new Date().toISOString();
  if (!presentMembers || presentMembers.length === 0 || playersPerTeam <= 0) {
    return {
      teams: [],
      waitingList: [],
      algorithm,
      playersPerTeam,
      timestamp,
    };
  }

  const numTeams = Math.floor(presentMembers.length / playersPerTeam);

  if (numTeams === 0) {
    return {
      teams: [],
      waitingList: [...presentMembers],
      algorithm,
      playersPerTeam,
      timestamp,
    };
  }

  const teamLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const teams: GeneratedTeam[] = Array.from({ length: numTeams }, (_, i) => ({
    name: `Time ${teamLetters[i] || i + 1}`,
    members: [],
    averageRating: 0,
  }));

  const waitingList: { id: string; name: string; email?: string; rating: number }[] = [];

  if (algorithm === 'aleatorio') {
    // Embaralhamento puro (Fisher-Yates)
    const shuffled = [...presentMembers].sort(() => Math.random() - 0.5);
    const activeCount = numTeams * playersPerTeam;

    const activePlayers = shuffled.slice(0, activeCount);
    const remaining = shuffled.slice(activeCount);

    activePlayers.forEach((player, idx) => {
      const teamIdx = Math.floor(idx / playersPerTeam);
      teams[teamIdx].members.push(player);
    });

    waitingList.push(...remaining);
  } else {
    // Algoritmo de Equilíbrio Técnico (Greedy / Snake balanceado com micro-variação)
    // 1. Ordena os jogadores por pontuação decrescente
    const sorted = [...presentMembers].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return Math.random() - 0.5; // desempate aleatório
    });

    const activeCount = numTeams * playersPerTeam;
    const activePlayers = sorted.slice(0, activeCount);
    const remaining = sorted.slice(activeCount);

    // 2. Distribuição Snake / Gulosa para equilibrar a soma total de estrelas
    activePlayers.forEach((player) => {
      // Encontra o time que possui a menor soma de estrelas e ainda tem vagas
      let bestTeamIdx = -1;
      let minScore = Infinity;

      for (let i = 0; i < teams.length; i++) {
        if (teams[i].members.length < playersPerTeam) {
          const currentSum = teams[i].members.reduce((acc, m) => acc + m.rating, 0);
          if (currentSum < minScore) {
            minScore = currentSum;
            bestTeamIdx = i;
          }
        }
      }

      if (bestTeamIdx !== -1) {
        teams[bestTeamIdx].members.push(player);
      } else {
        remaining.push(player);
      }
    });

    waitingList.push(...remaining);
  }

  // Calcula a média técnica de cada time
  teams.forEach((t) => {
    if (t.members.length > 0) {
      const sum = t.members.reduce((acc, m) => acc + m.rating, 0);
      t.averageRating = Number((sum / t.members.length).toFixed(1));
    }
  });

  return {
    teams,
    waitingList,
    algorithm,
    playersPerTeam,
    timestamp,
  };
}

/**
 * Converte o resultado em SorteioTimeResultado para persistência
 */
export function convertDrawToResultadoItems(
  drawResult: DrawResult,
  sorteioId?: string
): SorteioTimeResultado[] {
  const items: SorteioTimeResultado[] = [];

  drawResult.teams.forEach((team) => {
    team.members.forEach((m) => {
      items.push({
        sorteioId,
        identificadorTime: team.name,
        jogadorId: m.id,
        jogadorNome: m.name,
        jogadorEmail: m.email,
        classificacao: m.rating,
      });
    });
  });

  drawResult.waitingList.forEach((m) => {
    items.push({
      sorteioId,
      identificadorTime: 'Espera / Próximos',
      jogadorId: m.id,
      jogadorNome: m.name,
      jogadorEmail: m.email,
      classificacao: m.rating,
    });
  });

  return items;
}

/**
 * Formata o resultado do sorteio para compartilhamento limpo no WhatsApp
 */
export function formatWhatsAppMessage(
  drawResult: DrawResult,
  teamName: string,
  responsibleName: string
): string {
  const dateObj = new Date(drawResult.timestamp);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const algoText =
    drawResult.algorithm === 'equilibrado'
      ? '⚖️ Equilíbrio Técnico (Média por Estrelas ⭐)'
      : '🎲 Totalmente Aleatório (Sorte Pura)';

  let msg = `🏐 *ARENA FAHEL BEACH - SORTEIO DE TIMES* 🏐\n\n`;
  msg += `🏆 *Equipe:* ${teamName}\n`;
  msg += `📅 *Data/Hora:* ${formattedDate} às ${formattedTime}\n`;
  msg += `👤 *Sorteado por:* ${responsibleName}\n`;
  msg += `⚙️ *Modo:* ${algoText}\n`;
  msg += `👥 *Formato:* ${drawResult.playersPerTeam} atletas por time\n`;
  msg += `────────────────────────\n\n`;

  drawResult.teams.forEach((t) => {
    msg += `🔷 *${t.name.toUpperCase()}* (Média: ⭐ ${t.averageRating.toFixed(1)})\n`;
    t.members.forEach((m) => {
      msg += `  • ${m.name} (⭐ ${m.rating})\n`;
    });
    msg += `\n`;
  });

  if (drawResult.waitingList.length > 0) {
    msg += `⏳ *LISTA DE ESPERA / PRÓXIMOS:* \n`;
    drawResult.waitingList.forEach((m) => {
      msg += `  • ${m.name} (⭐ ${m.rating})\n`;
    });
    msg += `\n`;
  }

  msg += `────────────────────────\n`;
  msg += `_Histórico registrado e auditado no Módulo do Jogador - Arena Fahel Beach_`;

  return msg;
}
