import { Jogador, EquipeJogador, EquipeMembro, SorteioHistorico } from '../types';

export const INITIAL_JOGADORES: Jogador[] = [
  {
    id: 'jog-1',
    email: 'joao.silva@email.com',
    nomeApelido: 'João Silva',
    classificacaoGeral: 4.5,
    criadoEm: '2026-08-01T10:00:00Z'
  },
  {
    id: 'jog-2',
    email: 'carlos.atleta@email.com',
    nomeApelido: 'Carlos Atleta',
    classificacaoGeral: 5.0,
    criadoEm: '2026-08-02T11:30:00Z'
  },
  {
    id: 'jog-3',
    email: 'mariana.costa@email.com',
    nomeApelido: 'Mariana Costa',
    classificacaoGeral: 3.5,
    criadoEm: '2026-08-03T14:15:00Z'
  },
  {
    id: 'jog-4',
    email: 'rodrigo.volei@email.com',
    nomeApelido: 'Rodrigo Vôlei',
    classificacaoGeral: 4.0,
    criadoEm: '2026-08-04T09:00:00Z'
  },
  {
    id: 'jog-5',
    email: 'lucas.praia@email.com',
    nomeApelido: 'Lucas Santos',
    classificacaoGeral: 3.0,
    criadoEm: '2026-08-05T16:20:00Z'
  },
  {
    id: 'jog-6',
    email: 'fernanda.ftv@email.com',
    nomeApelido: 'Fernanda FTV',
    classificacaoGeral: 4.5,
    criadoEm: '2026-08-06T18:40:00Z'
  },
  {
    id: 'jog-7',
    email: 'beatriz.lima@email.com',
    nomeApelido: 'Beatriz Lima',
    classificacaoGeral: 3.5,
    criadoEm: '2026-08-07T08:10:00Z'
  },
  {
    id: 'jog-8',
    email: 'gabriel.souza@email.com',
    nomeApelido: 'Gabriel Souza',
    classificacaoGeral: 4.0,
    criadoEm: '2026-08-08T19:00:00Z'
  }
];

export const INITIAL_EQUIPES: EquipeJogador[] = [
  {
    id: 'eq-1',
    nome: 'Vôlei de Terça & Quinta - Copacabana',
    criadoPorJogadorId: 'jog-1',
    criadoPorNome: 'João Silva',
    criadoEm: '2026-08-10T14:00:00Z'
  },
  {
    id: 'eq-2',
    nome: 'Futevôlei dos Monstros',
    criadoPorJogadorId: 'jog-2',
    criadoPorNome: 'Carlos Atleta',
    criadoEm: '2026-08-12T19:30:00Z'
  },
  {
    id: 'eq-3',
    nome: 'Beach Tennis Quarteto de Sábado',
    criadoPorJogadorId: 'jog-3',
    criadoPorNome: 'Mariana Costa',
    criadoEm: '2026-08-14T08:00:00Z'
  }
];

export const INITIAL_EQUIPE_MEMBROS: EquipeMembro[] = [
  // Equipe 1 (Vôlei Copacabana)
  { equipeId: 'eq-1', jogadorId: 'jog-1', classificacaoNaEquipe: 5, nomeApelido: 'João Silva', email: 'joao.silva@email.com', inseridoEm: '2026-08-10T14:00:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-2', classificacaoNaEquipe: 5, nomeApelido: 'Carlos Atleta', email: 'carlos.atleta@email.com', inseridoEm: '2026-08-10T14:05:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-3', classificacaoNaEquipe: 3, nomeApelido: 'Mariana Costa', email: 'mariana.costa@email.com', inseridoEm: '2026-08-10T14:05:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-4', classificacaoNaEquipe: 4, nomeApelido: 'Rodrigo Vôlei', email: 'rodrigo.volei@email.com', inseridoEm: '2026-08-10T14:06:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-5', classificacaoNaEquipe: 3, nomeApelido: 'Lucas Santos', email: 'lucas.praia@email.com', inseridoEm: '2026-08-10T14:07:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-6', classificacaoNaEquipe: 4, nomeApelido: 'Fernanda FTV', email: 'fernanda.ftv@email.com', inseridoEm: '2026-08-10T14:08:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-7', classificacaoNaEquipe: 3, nomeApelido: 'Beatriz Lima', email: 'beatriz.lima@email.com', inseridoEm: '2026-08-10T14:09:00Z' },
  { equipeId: 'eq-1', jogadorId: 'jog-8', classificacaoNaEquipe: 4, nomeApelido: 'Gabriel Souza', email: 'gabriel.souza@email.com', inseridoEm: '2026-08-10T14:10:00Z' },

  // Equipe 2 (Futevôlei dos Monstros)
  { equipeId: 'eq-2', jogadorId: 'jog-2', classificacaoNaEquipe: 5, nomeApelido: 'Carlos Atleta', email: 'carlos.atleta@email.com', inseridoEm: '2026-08-12T19:30:00Z' },
  { equipeId: 'eq-2', jogadorId: 'jog-4', classificacaoNaEquipe: 4, nomeApelido: 'Rodrigo Vôlei', email: 'rodrigo.volei@email.com', inseridoEm: '2026-08-12T19:35:00Z' },
  { equipeId: 'eq-2', jogadorId: 'jog-6', classificacaoNaEquipe: 5, nomeApelido: 'Fernanda FTV', email: 'fernanda.ftv@email.com', inseridoEm: '2026-08-12T19:36:00Z' },
  { equipeId: 'eq-2', jogadorId: 'jog-8', classificacaoNaEquipe: 4, nomeApelido: 'Gabriel Souza', email: 'gabriel.souza@email.com', inseridoEm: '2026-08-12T19:37:00Z' },

  // Equipe 3 (Beach Tennis Sábado)
  { equipeId: 'eq-3', jogadorId: 'jog-3', classificacaoNaEquipe: 4, nomeApelido: 'Mariana Costa', email: 'mariana.costa@email.com', inseridoEm: '2026-08-14T08:00:00Z' },
  { equipeId: 'eq-3', jogadorId: 'jog-1', classificacaoNaEquipe: 4, nomeApelido: 'João Silva', email: 'joao.silva@email.com', inseridoEm: '2026-08-14T08:02:00Z' },
  { equipeId: 'eq-3', jogadorId: 'jog-5', classificacaoNaEquipe: 3, nomeApelido: 'Lucas Santos', email: 'lucas.praia@email.com', inseridoEm: '2026-08-14T08:05:00Z' },
  { equipeId: 'eq-3', jogadorId: 'jog-7', classificacaoNaEquipe: 4, nomeApelido: 'Beatriz Lima', email: 'beatriz.lima@email.com', inseridoEm: '2026-08-14T08:06:00Z' }
];

export const INITIAL_SORTEIOS: SorteioHistorico[] = [
  {
    id: 'sort-1',
    equipeId: 'eq-1',
    equipeNome: 'Vôlei de Terça & Quinta - Copacabana',
    realizadoPorJogadorId: 'jog-1',
    realizadoPorNome: 'João Silva',
    realizadoPorEmail: 'joao.silva@email.com',
    algoritmoUtilizado: 'equilibrado',
    quantidadePorTime: 4,
    realizadoEm: '2026-08-18T10:15:00Z',
    timesResultado: [
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-2',
        jogadorNome: 'Carlos Atleta',
        jogadorEmail: 'carlos.atleta@email.com',
        classificacao: 5
      },
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-4',
        jogadorNome: 'Rodrigo Vôlei',
        jogadorEmail: 'rodrigo.volei@email.com',
        classificacao: 4
      },
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-5',
        jogadorNome: 'Lucas Santos',
        jogadorEmail: 'lucas.praia@email.com',
        classificacao: 3
      },
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-7',
        jogadorNome: 'Beatriz Lima',
        jogadorEmail: 'beatriz.lima@email.com',
        classificacao: 3
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-1',
        jogadorNome: 'João Silva',
        jogadorEmail: 'joao.silva@email.com',
        classificacao: 5
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-6',
        jogadorNome: 'Fernanda FTV',
        jogadorEmail: 'fernanda.ftv@email.com',
        classificacao: 4
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-8',
        jogadorNome: 'Gabriel Souza',
        jogadorEmail: 'gabriel.souza@email.com',
        classificacao: 4
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-3',
        jogadorNome: 'Mariana Costa',
        jogadorEmail: 'mariana.costa@email.com',
        classificacao: 3
      }
    ]
  },
  {
    id: 'sort-2',
    equipeId: 'eq-2',
    equipeNome: 'Futevôlei dos Monstros',
    realizadoPorJogadorId: 'jog-2',
    realizadoPorNome: 'Carlos Atleta',
    realizadoPorEmail: 'carlos.atleta@email.com',
    algoritmoUtilizado: 'aleatorio',
    quantidadePorTime: 2,
    realizadoEm: '2026-08-16T18:45:00Z',
    timesResultado: [
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-2',
        jogadorNome: 'Carlos Atleta',
        jogadorEmail: 'carlos.atleta@email.com',
        classificacao: 5
      },
      {
        identificadorTime: 'Time A',
        jogadorId: 'jog-8',
        jogadorNome: 'Gabriel Souza',
        jogadorEmail: 'gabriel.souza@email.com',
        classificacao: 4
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-4',
        jogadorNome: 'Rodrigo Vôlei',
        jogadorEmail: 'rodrigo.volei@email.com',
        classificacao: 4
      },
      {
        identificadorTime: 'Time B',
        jogadorId: 'jog-6',
        jogadorNome: 'Fernanda FTV',
        jogadorEmail: 'fernanda.ftv@email.com',
        classificacao: 5
      }
    ]
  }
];
