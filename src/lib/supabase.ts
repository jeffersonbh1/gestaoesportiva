import { createClient } from '@supabase/supabase-js';
import { Court, Booking, BookingStudent, User, Player, PlayerRating, Sport, CourtTypeItem, Teacher, Student } from '../types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '../data/mockData';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Cliente do Supabase com inicialização segura
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mapeamento auxiliar entre IDs mock legados e UUIDs reais do banco
const MOCK_COURT_MAP: Record<string, string> = {
  'court-1': '00000000-0000-0000-0000-000000000001',
  'court-2': '00000000-0000-0000-0000-000000000002',
  'court-3': '00000000-0000-0000-0000-000000000003',
  'court-4': '00000000-0000-0000-0000-000000000004',
};

// Verifica se uma string é um UUID válido do PostgreSQL
export function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ====================================================================
// USUÁRIOS (tabela: usuarios)
// ====================================================================

export async function dbGetUsers(): Promise<User[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar usuários do Supabase:', error);
    throw error;
  }

  return (data || []).map((u) => ({
    id: u.id,
    username: u.login,
    password: u.senha,
    name: u.nome,
    role: u.perfil === 'Administrador' ? 'Administrador' : 'Usuário',
    email: u.email || undefined,
    phone: u.telefone || undefined,
  }));
}

export async function dbSaveUser(user: User): Promise<User | null> {
  if (!supabase) return null;

  let perfil = user.role;
  if (perfil === ('Admin' as any)) perfil = 'Administrador';
  if (perfil === ('User' as any)) perfil = 'Usuário';
  if (perfil !== 'Administrador' && perfil !== 'Usuário') perfil = 'Usuário';

  const dbUser: any = {
    login: user.username,
    senha: user.password || 'senha123',
    nome: user.name,
    perfil: perfil,
    email: user.email || null,
    telefone: user.phone || null,
  };

  const isUuid = isValidUuid(user.id);
  if (isUuid) {
    dbUser.id = user.id;
  }

  const query = supabase.from('usuarios');
  const { data, error } = isUuid
    ? await query.upsert(dbUser).select().single()
    : await query.upsert(dbUser, { onConflict: 'login' }).select().single();

  if (error) {
    console.error('Erro ao salvar usuário no Supabase:', error);
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

// Helper para garantir UUID de professor no Supabase
async function ensureTeacherUuid(teacherId?: string, teacherName?: string, sport?: string): Promise<string | null> {
  if (!supabase) return null;
  if (teacherId && isValidUuid(teacherId)) return teacherId;
  if (!teacherName || !teacherName.trim()) return null;

  const cleanName = teacherName.trim();
  const simpleName = cleanName.replace(/^(prof\.|profa\.|professor|professora)\s+/i, '').trim();

  try {
    // 1. Tenta buscar pelo nome na tabela professores (nome exato ou sem prefixo Prof.)
    const { data } = await supabase
      .from('professores')
      .select('id, nome')
      .or(`nome.ilike.${cleanName},nome.ilike.%${simpleName}%`)
      .limit(1);

    if (data && data.length > 0) {
      return data[0].id;
    }

    // 2. Se não encontrou, insere novo professor na tabela professores para obter UUID
    const { data: inserted, error } = await supabase
      .from('professores')
      .insert({
        nome: cleanName,
        esporte: sport || 'Futevôlei',
        status: 'Ativo'
      })
      .select('id');

    if (error) {
      console.warn('Aviso ao auto-criar professor em professores:', error);
    }
    if (inserted && inserted.length > 0) {
      return inserted[0].id;
    }
  } catch (err) {
    console.warn('Erro em ensureTeacherUuid:', err);
  }

  return null;
}

// Helper para garantir UUID de aluno no Supabase
async function ensureStudentUuid(studentId?: string, studentName?: string, sport?: string, teacherIdUuid?: string | null): Promise<string | null> {
  if (!supabase) return null;
  if (studentId && isValidUuid(studentId)) return studentId;
  if (!studentName || !studentName.trim()) return null;

  const cleanName = studentName.trim();

  try {
    // 1. Tenta buscar pelo nome na tabela alunos
    const { data } = await supabase
      .from('alunos')
      .select('id, nome')
      .ilike('nome', `%${cleanName}%`)
      .limit(1);

    if (data && data.length > 0) {
      return data[0].id;
    }

    // 2. Se não encontrou, insere novo aluno na tabela alunos para obter UUID
    const studentPayload: any = {
      nome: cleanName,
      esporte: sport || 'Futevôlei',
      status: 'Ativo'
    };
    if (teacherIdUuid && isValidUuid(teacherIdUuid)) {
      studentPayload.professor_id = teacherIdUuid;
    }

    const { data: inserted, error } = await supabase
      .from('alunos')
      .insert(studentPayload)
      .select('id');

    if (error) {
      console.warn('Aviso ao auto-criar aluno em alunos:', error);
    }
    if (inserted && inserted.length > 0) {
      return inserted[0].id;
    }
  } catch (err) {
    console.warn('Erro em ensureStudentUuid:', err);
  }

  return null;
}

// ====================================================================
// PROFESSORES & ALUNOS (tabelas: professores, alunos)
// ====================================================================

export async function dbGetTeachers(): Promise<Teacher[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar professores do Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Popular tabela professores com os iniciais
      const toInsert = INITIAL_TEACHERS.map((t) => ({
        nome: t.name,
        telefone: t.phone || null,
        esporte: t.sport || 'Futevôlei',
        email: t.email || null,
        preco_aula: Number(t.pricePerClass) || 0,
        status: t.status || 'Ativo',
        observacoes: t.notes || null,
      }));
      await supabase.from('professores').insert(toInsert);

      const { data: reData } = await supabase
        .from('professores')
        .select('*')
        .order('nome', { ascending: true });

      if (reData && reData.length > 0) {
        return reData.map((p) => ({
          id: p.id,
          name: p.nome,
          phone: p.telefone || '',
          sport: p.esporte || 'Futevôlei',
          email: p.email || undefined,
          pricePerClass: Number(p.preco_aula) || 0,
          status: p.status || 'Ativo',
          notes: p.observacoes || undefined,
        }));
      }
    }

    return (data || []).map((p) => ({
      id: p.id,
      name: p.nome,
      phone: p.telefone || '',
      sport: p.esporte || 'Futevôlei',
      email: p.email || undefined,
      pricePerClass: Number(p.preco_aula) || 0,
      status: p.status || 'Ativo',
      notes: p.observacoes || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar professores:', err);
    return [];
  }
}

export async function dbSaveTeacher(teacher: Teacher): Promise<Teacher | null> {
  if (!supabase) return null;

  const dbProf: any = {
    nome: teacher.name,
    telefone: teacher.phone || null,
    esporte: teacher.sport || 'Futevôlei',
    email: teacher.email || null,
    preco_aula: Number(teacher.pricePerClass) || 0,
    status: teacher.status || 'Ativo',
    observacoes: teacher.notes || null,
  };

  if (isValidUuid(teacher.id)) {
    dbProf.id = teacher.id;
  }

  const { data, error } = await supabase
    .from('professores')
    .upsert(dbProf)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar professor no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      phone: data.telefone || '',
      sport: data.esporte || 'Futevôlei',
      email: data.email || undefined,
      pricePerClass: Number(data.preco_aula) || 0,
      status: data.status || 'Ativo',
      notes: data.observacoes || undefined,
    };
  }

  return null;
}

export async function dbGetStudents(): Promise<Student[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, professores(nome)')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar alunos do Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Popular tabela alunos com os iniciais
      const toInsert = INITIAL_STUDENTS.map((s) => ({
        nome: s.name,
        telefone: s.phone || null,
        esporte: s.sport || 'Futevôlei',
        nivel: s.level || 'Iniciante',
        status: s.status || 'Ativo',
      }));
      await supabase.from('alunos').insert(toInsert);

      const { data: reData } = await supabase
        .from('alunos')
        .select('*, professores(nome)')
        .order('nome', { ascending: true });

      if (reData && reData.length > 0) {
        return reData.map((a) => ({
          id: a.id,
          name: a.nome,
          phone: a.telefone || '',
          sport: a.esporte || 'Futevôlei',
          level: a.nivel || 'Iniciante',
          teacherId: a.professor_id || undefined,
          teacherName: a.professores?.nome || undefined,
          status: a.status || 'Ativo',
          notes: a.observacoes || undefined,
        }));
      }
    }

    return (data || []).map((a) => ({
      id: a.id,
      name: a.nome,
      phone: a.telefone || '',
      sport: a.esporte || 'Futevôlei',
      level: a.nivel || 'Iniciante',
      teacherId: a.professor_id || undefined,
      teacherName: a.professores?.nome || undefined,
      status: a.status || 'Ativo',
      notes: a.observacoes || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar alunos:', err);
    return [];
  }
}

export async function dbSaveStudent(student: Student): Promise<Student | null> {
  if (!supabase) return null;

  const dbAluno: any = {
    nome: student.name,
    telefone: student.phone || null,
    esporte: student.sport || 'Futevôlei',
    nivel: student.level || 'Iniciante',
    professor_id: isValidUuid(student.teacherId || '') ? student.teacherId : null,
    status: student.status || 'Ativo',
    observacoes: student.notes || null,
  };

  if (isValidUuid(student.id)) {
    dbAluno.id = student.id;
  }

  const { data, error } = await supabase
    .from('alunos')
    .upsert(dbAluno)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar aluno no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      phone: data.telefone || '',
      sport: data.esporte || 'Futevôlei',
      level: data.nivel || 'Iniciante',
      teacherId: data.professor_id || undefined,
      status: data.status || 'Ativo',
      notes: data.observacoes || undefined,
    };
  }

  return null;
}

export async function dbGetCourts(): Promise<Court[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('quadras')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar quadras do Supabase:', error);
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

export async function dbSaveCourt(court: Court): Promise<Court | null> {
  if (!supabase) return null;

  const validTypes = ['Areia', 'Poliesportiva', 'Saibro', 'Coberta'];
  const validStatuses = ['Disponível', 'Ocupada', 'Manutenção'];

  const targetId = MOCK_COURT_MAP[court.id] || court.id;

  const dbCourt: any = {
    nome: court.name,
    tipo: validTypes.includes(court.type) ? court.type : 'Areia',
    status: validStatuses.includes(court.status) ? court.status : 'Disponível',
    preco_por_hora: Number(court.pricePerHour) || 0,
    descricao: court.description || null,
  };

  if (isValidUuid(targetId)) {
    dbCourt.id = targetId;
  }

  const { data, error } = await supabase
    .from('quadras')
    .upsert(dbCourt)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar quadra no Supabase:', error);
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

export async function dbDeleteCourt(courtId: string): Promise<void> {
  if (!supabase) return;

  const targetId = MOCK_COURT_MAP[courtId] || courtId;
  const query = supabase.from('quadras').delete();
  const { error } = isValidUuid(targetId)
    ? await query.eq('id', targetId)
    : await query.eq('nome', courtId);

  if (error) {
    console.error('Erro ao deletar quadra do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// AGENDAMENTOS E RACHAS (tabelas: agendamentos & jogadores_racha)
// ====================================================================

export async function dbGetBookings(): Promise<Booking[]> {
  if (!supabase) return [];

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

  // Buscar dados da tabela relational de aulas se disponível
  let aulasMap: Record<string, { teacherId?: string; teacherName?: string; students: BookingStudent[] }> = {};
  try {
    const { data: aulasData } = await supabase
      .from('aulas')
      .select('agendamento_id, professor_id, aluno_id, professores(nome), alunos(nome)');
    
    if (aulasData && aulasData.length > 0) {
      aulasData.forEach((a: any) => {
        const bId = a.agendamento_id;
        if (!aulasMap[bId]) {
          aulasMap[bId] = {
            teacherId: a.professor_id || undefined,
            teacherName: a.professores?.nome || undefined,
            students: []
          };
        }
        if (a.aluno_id || a.alunos?.nome) {
          aulasMap[bId].students.push({
            studentId: a.aluno_id || `st-${Date.now()}`,
            studentName: a.alunos?.nome || 'Aluno'
          });
        }
      });
    }
  } catch (err) {
    // Tabela aulas pode não existir ainda se a migration não foi executada
  }

  return bData.map((b) => {
    const formatTime = (t: string) => (t ? t.slice(0, 5) : '00:00');

    // Extrair bookingType das observações se gravado no formato [Tipo: ...]
    let bookingType = 'Aluguel';
    let notes = b.observacoes || undefined;
    if (notes && notes.startsWith('[Tipo: ')) {
      const closingIdx = notes.indexOf(']');
      if (closingIdx > 7) {
        bookingType = notes.substring(7, closingIdx);
        notes = notes.substring(closingIdx + 1).trim() || undefined;
      }
    }

    const classData = aulasMap[b.id];
    const students = classData?.students && classData.students.length > 0 
      ? classData.students 
      : (b.aluno_id || b.aluno_nome ? [{ studentId: b.aluno_id || 'st-1', studentName: b.aluno_nome || '' }] : []);

    return {
      id: b.id,
      courtId: b.quadra_id,
      customerName: b.nome_cliente,
      customerPhone: b.telefone_cliente,
      date: b.data,
      startTime: formatTime(b.horario_inicio),
      endTime: formatTime(b.horario_fim),
      sport: b.esporte,
      bookingType: bookingType,
      teacherId: classData?.teacherId || b.professor_id || undefined,
      teacherName: classData?.teacherName || b.professor_nome || undefined,
      students: students,
      studentId: students[0]?.studentId || b.aluno_id || undefined,
      studentName: students[0]?.studentName || b.aluno_nome || undefined,
      totalValue: Number(b.valor_total),
      paymentStatus: b.status_pagamento,
      paymentMethod: b.metodo_pagamento,
      notes: notes,
      createdAt: b.criado_em,
      players: playersMap[b.id] || [],
    };
  });
}

export async function dbSaveBooking(booking: Booking): Promise<Booking | null> {
  if (!supabase) return null;

  // 1. Resolve quadra_id para um UUID válido no banco de dados
  let targetCourtId = MOCK_COURT_MAP[booking.courtId] || booking.courtId;

  if (!isValidUuid(targetCourtId)) {
    const { data: quadras } = await supabase.from('quadras').select('id, nome');
    if (quadras && quadras.length > 0) {
      const matched = quadras.find((q) => q.nome.toLowerCase().includes(booking.courtId.toLowerCase()));
      targetCourtId = matched ? matched.id : quadras[0].id;
    } else {
      console.error('Nenhuma quadra cadastrada no Supabase para associar ao agendamento.');
      throw new Error('É necessário ter ao menos uma quadra cadastrada no Supabase.');
    }
  }

  // 2. Valida os campos com a restrição CHECK da tabela agendamentos
  const validSports = ['Vôlei de Areia', 'Futevôlei', 'Vôlei de Quadra', 'Beach Tennis'];
  const validPaymentStatuses = ['Pago', 'Pendente', 'Reembolsado'];
  const validPaymentMethods = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];

  const esporte = validSports.includes(booking.sport) ? booking.sport : 'Vôlei de Areia';
  const status_pagamento = validPaymentStatuses.includes(booking.paymentStatus) ? booking.paymentStatus : 'Pendente';
  const metodo_pagamento = validPaymentMethods.includes(booking.paymentMethod) ? booking.paymentMethod : 'Pix';

  // 3. Inclui o tipo de agendamento nas observações para compatibilidade total com o schema
  let observacoes = booking.notes || '';
  if (booking.bookingType && booking.bookingType !== 'Aluguel') {
    if (!observacoes.includes(`[Tipo: ${booking.bookingType}]`)) {
      observacoes = `[Tipo: ${booking.bookingType}] ${observacoes}`.trim();
    }
  }

  // 4. Constrói o objeto dbBooking estritamente com as colunas da tabela agendamentos
  const dbBooking: any = {
    quadra_id: targetCourtId,
    nome_cliente: booking.customerName || 'Cliente',
    telefone_cliente: booking.customerPhone || '-',
    data: booking.date,
    horario_inicio: booking.startTime.length === 5 ? `${booking.startTime}:00` : booking.startTime,
    horario_fim: booking.endTime.length === 5 ? `${booking.endTime}:00` : booking.endTime,
    esporte: esporte,
    valor_total: Number(booking.totalValue) || 0,
    status_pagamento: status_pagamento,
    metodo_pagamento: metodo_pagamento,
    observacoes: observacoes || null,
  };

  // Se o ID for um UUID válido do banco, inclui para atualização (UPDATE)
  if (isValidUuid(booking.id)) {
    dbBooking.id = booking.id;
  }

  // Executa o upsert no Supabase
  const { data, error } = await supabase
    .from('agendamentos')
    .upsert(dbBooking)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar agendamento no Supabase:', error);
    throw error;
  }

  const bookingId = data.id;

  // 5. Salva vinculo na tabela de aulas para agendamentos do tipo Aula
  if ((booking.bookingType || '').toLowerCase().includes('aula') || booking.teacherId || booking.teacherName || (booking.students && booking.students.length > 0)) {
    try {
      await supabase.from('aulas').delete().eq('agendamento_id', bookingId);

      const teacherUuid = await ensureTeacherUuid(booking.teacherId, booking.teacherName, booking.sport);

      const studentsToInsert = booking.students && booking.students.length > 0
        ? booking.students
        : (booking.studentId ? [{ studentId: booking.studentId, studentName: booking.studentName || '' }] : []);

      if (studentsToInsert.length > 0) {
        const aulaRows = [];
        for (const st of studentsToInsert) {
          const studentUuid = await ensureStudentUuid(st.studentId, st.studentName, booking.sport, teacherUuid);
          aulaRows.push({
            agendamento_id: bookingId,
            professor_id: teacherUuid,
            aluno_id: studentUuid,
          });
        }
        await supabase.from('aulas').insert(aulaRows);
      } else if (teacherUuid) {
        await supabase.from('aulas').insert([{
          agendamento_id: bookingId,
          professor_id: teacherUuid,
          aluno_id: null
        }]);
      }
    } catch (aulasErr) {
      console.warn('Erro ao sincronizar tabela aulas no Supabase:', aulasErr);
    }
  }

  // 5. Sincroniza os jogadores de racha (jogadores_racha)
  if (booking.players && booking.players.length > 0) {
    // Remove jogadores antigos do agendamento
    await supabase
      .from('jogadores_racha')
      .delete()
      .eq('agendamento_id', bookingId);

    // Insere os novos jogadores
    const dbPlayers = booking.players.map((p) => {
      const item: any = {
        agendamento_id: bookingId,
        nome: p.name,
        email: p.email || null,
        telefone: p.phone || null,
        pago: p.hasPaid,
        valor: Number(p.amount) || 0,
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
      console.error('Erro ao salvar jogadores de racha no Supabase:', insError);
    }
  }

  return {
    ...booking,
    id: bookingId,
    courtId: targetCourtId,
  };
}

export async function dbDeleteBooking(bookingId: string): Promise<void> {
  if (!supabase) return;

  try {
    // Clean up linked rows in child tables first to avoid foreign key constraints
    await supabase.from('aulas').delete().eq('agendamento_id', bookingId);
    await supabase.from('jogadores_racha').delete().eq('agendamento_id', bookingId);
    await supabase.from('avaliacoes_jogadores').delete().eq('agendamento_id', bookingId);
  } catch (childErr) {
    console.warn('Aviso ao excluir dependências do agendamento:', childErr);
  }

  const { error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error('Erro ao deletar agendamento do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// AVALIAÇÕES DE JOGADORES (tabela: avaliacoes_jogadores)
// ====================================================================

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

// ====================================================================
// ESPORTES (tabela: esportes)
// ====================================================================

export async function dbGetSports(): Promise<Sport[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('esportes')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar esportes do Supabase:', error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.nome,
    description: s.descricao || undefined,
    active: s.ativo ?? true,
  }));
}

export async function dbSaveSport(sport: Sport): Promise<Sport | null> {
  if (!supabase) return null;

  const dbSport: any = {
    nome: sport.name,
    descricao: sport.description || null,
    ativo: sport.active ?? true,
  };

  const isUuid = isValidUuid(sport.id);
  if (isUuid) {
    dbSport.id = sport.id;
  }

  const query = supabase.from('esportes');
  const { data, error } = isUuid
    ? await query.upsert(dbSport).select().single()
    : await query.upsert(dbSport, { onConflict: 'nome' }).select().single();

  if (error) {
    console.error('Erro ao salvar esporte no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      description: data.descricao || undefined,
      active: data.ativo ?? true,
    };
  }

  return null;
}

export async function dbDeleteSport(sportId: string, sportName?: string): Promise<void> {
  if (!supabase) return;

  const query = supabase.from('esportes').delete();
  const { error } = isValidUuid(sportId)
    ? await query.eq('id', sportId)
    : await query.eq('nome', sportName || sportId);

  if (error) {
    console.error('Erro ao deletar esporte do Supabase:', error);
    throw error;
  }
}

// ====================================================================
// TIPOS DE QUADRA (tabela: tipos_quadra)
// ====================================================================

export async function dbGetCourtTypes(): Promise<CourtTypeItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tipos_quadra')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar tipos de quadra do Supabase:', error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    name: t.nome,
    description: t.descricao || undefined,
    active: t.ativo ?? true,
  }));
}

export async function dbSaveCourtType(courtType: CourtTypeItem): Promise<CourtTypeItem | null> {
  if (!supabase) return null;

  const dbType: any = {
    nome: courtType.name,
    descricao: courtType.description || null,
    ativo: courtType.active ?? true,
  };

  const isUuid = isValidUuid(courtType.id);
  if (isUuid) {
    dbType.id = courtType.id;
  }

  const query = supabase.from('tipos_quadra');
  const { data, error } = isUuid
    ? await query.upsert(dbType).select().single()
    : await query.upsert(dbType, { onConflict: 'nome' }).select().single();

  if (error) {
    console.error('Erro ao salvar tipo de quadra no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      description: data.descricao || undefined,
      active: data.ativo ?? true,
    };
  }

  return null;
}

export async function dbDeleteCourtType(courtTypeId: string, courtTypeName?: string): Promise<void> {
  if (!supabase) return;

  const query = supabase.from('tipos_quadra').delete();
  const { error } = isValidUuid(courtTypeId)
    ? await query.eq('id', courtTypeId)
    : await query.eq('nome', courtTypeName || courtTypeId);

  if (error) {
    console.error('Erro ao deletar tipo de quadra do Supabase:', error);
    throw error;
  }
}
