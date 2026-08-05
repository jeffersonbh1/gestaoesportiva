import { createClient } from '@supabase/supabase-js';
import { Court, Booking, User, Player, PlayerRating } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Lazy initialization client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check for valid PostgreSQL UUID
export function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ====================================================================
// USUÁRIOS (usuarios)
// ====================================================================

/**
 * Obtém todos os usuários cadastrados no Supabase
 */
export async function dbGetUsers(): Promise<User[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao obter usuários do Supabase:', error);
    throw error;
  }

  return (data || []).map((u) => ({
    id: u.id,
    username: u.login,
    password: u.senha,
    name: u.nome,
    role: u.perfil,
    email: u.email || undefined,
    phone: u.telefone || undefined,
  }));
}

/**
 * Insere ou atualiza (UPSERT) um usuário na tabela 'usuarios'
 */
export async function dbSaveUser(user: User): Promise<User | null> {
  if (!supabase) return null;

  const dbUser: any = {
    login: user.username,
    senha: user.password || 'senha123',
    nome: user.name,
    perfil: user.role,
    email: user.email || null,
    telefone: user.phone || null,
  };

  // Inclui o ID UUID apenas se for válido; caso contrário o Supabase gera o UUID
  if (isValidUuid(user.id)) {
    dbUser.id = user.id;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .upsert(dbUser, { onConflict: 'login' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar/atualizar usuário no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      username: data.login,
      password: data.senha,
      name: data.nome,
      role: data.perfil,
      email: data.email || undefined,
      phone: data.telefone || undefined,
    };
  }

  return null;
}

/**
 * Deleta um usuário do Supabase pelo ID ou login
 */
export async function dbDeleteUser(userId: string): Promise<void> {
  if (!supabase) return;

  const query = supabase.from('usuarios').delete();
  const { error } = isValidUuid(userId)
    ? await query.eq('id', userId)
    : await query.eq('login', userId);

  if (error) {
    console.error('Erro ao deletar usuário do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// QUADRAS (quadras)
// ====================================================================

/**
 * Obtém todas as quadras cadastradas no Supabase
 */
export async function dbGetCourts(): Promise<Court[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('quadras')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao obter quadras do Supabase:', error);
    throw error;
  }

  return (data || []).map((q) => ({
    id: q.id,
    name: q.nome,
    type: q.tipo,
    status: q.status,
    pricePerHour: Number(q.preco_por_hora),
    description: q.descricao || undefined,
  }));
}

/**
 * Insere ou atualiza (UPSERT) uma quadra no Supabase
 */
export async function dbSaveCourt(court: Court): Promise<Court | null> {
  if (!supabase) return null;

  const dbCourt: any = {
    nome: court.name,
    tipo: court.type,
    status: court.status,
    preco_por_hora: court.pricePerHour,
    descricao: court.description || null,
  };

  if (isValidUuid(court.id)) {
    dbCourt.id = court.id;
  }

  const { data, error } = await supabase
    .from('quadras')
    .upsert(dbCourt)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar/atualizar quadra no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      type: data.tipo,
      status: data.status,
      pricePerHour: Number(data.preco_por_hora),
      description: data.descricao || undefined,
    };
  }

  return null;
}

/**
 * Deleta uma quadra no Supabase
 */
export async function dbDeleteCourt(courtId: string): Promise<void> {
  if (!supabase) return;

  const query = supabase.from('quadras').delete();
  const { error } = isValidUuid(courtId)
    ? await query.eq('id', courtId)
    : await query.eq('nome', courtId);

  if (error) {
    console.error('Erro ao deletar quadra no Supabase:', error);
    throw error;
  }
}

// ====================================================================
// AGENDAMENTOS E RACHAS (agendamentos & jogadores_racha)
// ====================================================================

/**
 * Obtém todos os agendamentos e respectivos jogadores de racha do Supabase
 */
export async function dbGetBookings(): Promise<Booking[]> {
  if (!supabase) return [];

  // Buscar agendamentos
  const { data: bData, error: bError } = await supabase
    .from('agendamentos')
    .select('*')
    .order('data', { ascending: true })
    .order('horario_inicio', { ascending: true });

  if (bError) {
    console.error('Erro ao obter agendamentos do Supabase:', bError);
    throw bError;
  }

  if (!bData || bData.length === 0) return [];

  // Buscar todos os jogadores de racha vinculados
  const { data: pData, error: pError } = await supabase
    .from('jogadores_racha')
    .select('*');

  if (pError) {
    console.error('Erro ao obter jogadores de racha do Supabase:', pError);
    throw pError;
  }

  const playersMap: Record<string, Player[]> = {};
  (pData || []).forEach((p) => {
    if (!playersMap[p.agendamento_id]) {
      playersMap[p.agendamento_id] = [];
    }
    playersMap[p.agendamento_id].push({
      id: p.id,
      name: p.nome,
      email: p.email || undefined,
      phone: p.telefone || undefined,
      hasPaid: p.pago,
      amount: Number(p.valor),
    });
  });

  return bData.map((b) => {
    const formatTime = (t: string) => (t ? t.slice(0, 5) : '00:00');

    return {
      id: b.id,
      courtId: b.quadra_id,
      customerName: b.nome_cliente,
      customerPhone: b.telefone_cliente,
      date: b.data,
      startTime: formatTime(b.horario_inicio),
      endTime: formatTime(b.horario_fim),
      sport: b.esporte,
      bookingType: b.tipo_agendamento || 'Aluguel',
      totalValue: Number(b.valor_total),
      paymentStatus: b.status_pagamento,
      paymentMethod: b.metodo_pagamento,
      notes: b.observacoes || undefined,
      createdAt: b.criado_em,
      players: playersMap[b.id] || [],
    };
  });
}

/**
 * Insere ou atualiza (UPSERT) um agendamento e sincroniza os jogadores de racha
 */
export async function dbSaveBooking(booking: Booking): Promise<Booking | null> {
  if (!supabase) return null;

  // Garantir que quadra_id seja um UUID válido no banco de dados
  let targetCourtId = booking.courtId;
  if (!isValidUuid(targetCourtId)) {
    const { data: quadras } = await supabase.from('quadras').select('id, nome');
    if (quadras && quadras.length > 0) {
      // Tentar associar por nome ou pegar a primeira quadra disponível
      const matched = quadras.find((q) => q.nome.toLowerCase().includes(booking.courtId.toLowerCase()));
      targetCourtId = matched ? matched.id : quadras[0].id;
    } else {
      console.error('Nenhuma quadra cadastrada no Supabase para associar ao agendamento.');
      throw new Error('É necessário ter ao menos uma quadra cadastrada no Supabase.');
    }
  }

  const dbBooking: any = {
    quadra_id: targetCourtId,
    nome_cliente: booking.customerName,
    telefone_cliente: booking.customerPhone,
    data: booking.date,
    horario_inicio: booking.startTime,
    horario_fim: booking.endTime,
    esporte: booking.sport,
    tipo_agendamento: booking.bookingType || 'Aluguel',
    valor_total: booking.totalValue,
    status_pagamento: booking.paymentStatus,
    metodo_pagamento: booking.paymentMethod,
    observacoes: booking.notes || null,
  };

  if (isValidUuid(booking.id)) {
    dbBooking.id = booking.id;
  }

  // Tentar upsert
  const { data, error } = await supabase
    .from('agendamentos')
    .upsert(dbBooking, { onConflict: 'quadra_id,data,horario_inicio' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar agendamento no Supabase:', error);
    throw error;
  }

  const bookingId = data.id;

  // Sincronizar jogadores de racha (jogadores_racha)
  // 1. Limpa registros anteriores para este agendamento
  const { error: delError } = await supabase
    .from('jogadores_racha')
    .delete()
    .eq('agendamento_id', bookingId);

  if (delError) {
    console.error('Erro ao limpar jogadores anteriores de racha:', delError);
  }

  // 2. Insere os novos jogadores
  if (booking.players && booking.players.length > 0) {
    const dbPlayers = booking.players.map((p) => {
      const item: any = {
        agendamento_id: bookingId,
        nome: p.name,
        email: p.email || null,
        telefone: p.phone || null,
        pago: p.hasPaid,
        valor: p.amount,
      };
      if (isValidUuid(p.id)) {
        item.id = p.id;
      }
      return item;
    });

    const { error: insError } = await supabase
      .from('jogadores_racha')
      .insert(dbPlayers);

    if (insError) {
      console.error('Erro ao inserir jogadores de racha:', insError);
    }
  }

  return {
    ...booking,
    id: bookingId,
    courtId: targetCourtId,
  };
}

/**
 * Deleta um agendamento do Supabase e remove automaticamente os jogadores vinculados (CASCADE)
 */
export async function dbDeleteBooking(bookingId: string): Promise<void> {
  if (!supabase) return;

  const query = supabase.from('agendamentos').delete();
  const { error } = isValidUuid(bookingId)
    ? await query.eq('id', bookingId)
    : await query.eq('nome_cliente', bookingId);

  if (error) {
    console.error('Erro ao deletar agendamento do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// AVALIAÇÕES DE JOGADORES (avaliacoes_jogadores)
// ====================================================================

/**
 * Obtém avaliações de jogadores salvas no Supabase
 */
export async function dbGetRatings(bookingId?: string): Promise<PlayerRating[]> {
  if (!supabase) return [];

  let query = supabase.from('avaliacoes_jogadores').select('*');
  if (bookingId && isValidUuid(bookingId)) {
    query = query.eq('agendamento_id', bookingId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao obter avaliações do Supabase:', error);
    throw error;
  }

  return (data || []).map((r) => ({
    id: r.id,
    bookingId: r.agendamento_id,
    evaluatorName: r.avaliador_nome,
    ratedPlayerName: r.jogador_avaliado_nome,
    rating: r.nota,
    createdAt: r.criado_em,
  }));
}

/**
 * Insere ou atualiza uma avaliação de jogador no Supabase
 */
export async function dbSaveRating(rating: PlayerRating): Promise<void> {
  if (!supabase) return;

  if (!isValidUuid(rating.bookingId)) {
    console.warn('Não foi possível salvar avaliação no Supabase: bookingId não é um UUID válido.');
    return;
  }

  const dbRating: any = {
    agendamento_id: rating.bookingId,
    avaliador_nome: rating.evaluatorName,
    jogador_avaliado_nome: rating.ratedPlayerName,
    nota: rating.rating,
  };

  if (isValidUuid(rating.id)) {
    dbRating.id = rating.id;
  }

  const { error } = await supabase
    .from('avaliacoes_jogadores')
    .upsert(dbRating, { onConflict: 'agendamento_id,avaliador_nome,jogador_avaliado_nome' });

  if (error) {
    console.error('Erro ao salvar avaliação no Supabase:', error);
    throw error;
  }
}
