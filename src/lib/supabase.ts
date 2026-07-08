import { createClient } from '@supabase/supabase-js';
import { Court, Booking, User, Player } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Lazy initialization client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ====================================================================
// USUÁRIOS (usuarios)
// ====================================================================
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

export async function dbSaveUser(user: User): Promise<void> {
  if (!supabase) return;
  const dbUser = {
    id: user.id.includes('user-') ? undefined : user.id, // let db generate UUID if it's our mock string id
    login: user.username,
    senha: user.password || 'senha123',
    nome: user.name,
    perfil: user.role,
    email: user.email || null,
    telefone: user.phone || null,
  };

  const { error } = await supabase
    .from('usuarios')
    .upsert(dbUser, { onConflict: 'login' });

  if (error) {
    console.error('Erro ao salvar usuário no Supabase:', error);
    throw error;
  }
}

export async function dbDeleteUser(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Erro ao deletar usuário do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// QUADRAS (quadras)
// ====================================================================
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

export async function dbSaveCourt(court: Court): Promise<void> {
  if (!supabase) return;
  const dbCourt = {
    id: court.id.length < 36 ? undefined : court.id, // ignore mock IDs
    nome: court.name,
    tipo: court.type,
    status: court.status,
    preco_por_hora: court.pricePerHour,
    descricao: court.description || null,
  };

  const { error } = await supabase
    .from('quadras')
    .upsert(dbCourt);

  if (error) {
    console.error('Erro ao salvar quadra no Supabase:', error);
    throw error;
  }
}

export async function dbDeleteCourt(courtId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('quadras')
    .delete()
    .eq('id', courtId);

  if (error) {
    console.error('Erro ao deletar quadra do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// AGENDAMENTOS E RACHAS (agendamentos & jogadores_racha)
// ====================================================================
export async function dbGetBookings(): Promise<Booking[]> {
  if (!supabase) return [];
  
  // Get bookings
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

  // Get all players for racha
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
    // Format times to HH:MM (remove seconds if returned)
    const formatTime = (t: string) => t.slice(0, 5);

    return {
      id: b.id,
      courtId: b.quadra_id,
      customerName: b.nome_cliente,
      customerPhone: b.telefone_cliente,
      date: b.data,
      startTime: formatTime(b.horario_inicio),
      endTime: formatTime(b.horario_fim),
      sport: b.esporte,
      totalValue: Number(b.valor_total),
      paymentStatus: b.status_pagamento,
      paymentMethod: b.metodo_pagamento,
      notes: b.observacoes || undefined,
      createdAt: b.criado_em,
      players: playersMap[b.id] || [],
    };
  });
}

export async function dbSaveBooking(booking: Booking): Promise<void> {
  if (!supabase) return;

  const dbBooking = {
    id: booking.id.length < 36 ? undefined : booking.id, // ignore mock IDs
    quadra_id: booking.courtId,
    nome_cliente: booking.customerName,
    telefone_cliente: booking.customerPhone,
    data: booking.date,
    horario_inicio: booking.startTime,
    horario_fim: booking.endTime,
    esporte: booking.sport,
    valor_total: booking.totalValue,
    status_pagamento: booking.paymentStatus,
    metodo_pagamento: booking.paymentMethod,
    observacoes: booking.notes || null,
  };

  const { data, error } = await supabase
    .from('agendamentos')
    .upsert(dbBooking)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar agendamento no Supabase:', error);
    throw error;
  }

  // Save/Update players if any
  const bookingId = data.id;
  
  // First, delete existing players of this booking to repopulate
  const { error: delError } = await supabase
    .from('jogadores_racha')
    .delete()
    .eq('agendamento_id', bookingId);

  if (delError) {
    console.error('Erro ao limpar jogadores de racha do Supabase:', delError);
    throw delError;
  }

  if (booking.players && booking.players.length > 0) {
    const dbPlayers = booking.players.map((p) => ({
      agendamento_id: bookingId,
      nome: p.name,
      email: p.email || null,
      telefone: p.phone || null,
      pago: p.hasPaid,
      valor: p.amount,
    }));

    const { error: insError } = await supabase
      .from('jogadores_racha')
      .insert(dbPlayers);

    if (insError) {
      console.error('Erro ao salvar jogadores de racha no Supabase:', insError);
      throw insError;
    }
  }
}

export async function dbDeleteBooking(bookingId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error('Erro ao deletar agendamento do Supabase:', error);
    throw error;
  }
}
