import { createClient } from '@supabase/supabase-js';
import { Court, Booking, BookingStudent, User, Player, PlayerRating, Sport, CourtTypeItem, RentalType, Teacher, Student, Team, TeamMember, AwardQuestion } from '../types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS, INITIAL_COURT_TYPES, INITIAL_RENTAL_TYPES } from '../data/mockData';

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

  // 1. Se teacherId for um UUID válido, verifica se realmente existe na tabela 'professores'
  if (teacherId && isValidUuid(teacherId)) {
    try {
      const { data: pCheck } = await supabase
        .from('professores')
        .select('id')
        .eq('id', teacherId)
        .limit(1);
      if (pCheck && pCheck.length > 0) {
        return pCheck[0].id;
      }
    } catch (err) {
      console.warn('Erro ao verificar UUID de professor:', err);
    }
  }

  // 2. Tenta determinar o nome do professor
  let nameToSearch = teacherName?.trim();
  if (!nameToSearch && teacherId) {
    const foundInMock = INITIAL_TEACHERS.find((t) => t.id === teacherId);
    if (foundInMock) {
      nameToSearch = foundInMock.name;
    }
  }

  // Se não temos um nome, busca qualquer professor na tabela como fallback
  if (!nameToSearch) {
    try {
      const { data: anyProf } = await supabase
        .from('professores')
        .select('id')
        .limit(1);
      if (anyProf && anyProf.length > 0) {
        return anyProf[0].id;
      }
    } catch (_) {}
    return null;
  }

  const cleanName = nameToSearch.trim();
  const simpleName = cleanName.replace(/^(prof\.|profa\.|professor|professora)\s+/i, '').trim();

  try {
    // 3. Busca por nome simples (sem o prefixo Prof.) usando ilike direto
    if (simpleName) {
      const { data: dataSimple } = await supabase
        .from('professores')
        .select('id, nome')
        .ilike('nome', `%${simpleName}%`)
        .limit(1);

      if (dataSimple && dataSimple.length > 0) {
        return dataSimple[0].id;
      }
    }

    // 4. Busca por nome completo limpo se for diferente do nome simples
    if (cleanName && cleanName !== simpleName) {
      const sanitizedClean = cleanName.replace(/[^a-zA-Z0-9 áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '').trim();
      if (sanitizedClean) {
        const { data: dataClean } = await supabase
          .from('professores')
          .select('id, nome')
          .ilike('nome', `%${sanitizedClean}%`)
          .limit(1);

        if (dataClean && dataClean.length > 0) {
          return dataClean[0].id;
        }
      }
    }

    // 5. Se não encontrou, insere novo professor na tabela professores para obter UUID real
    const displayName = cleanName.startsWith('Prof') ? cleanName : `Prof. ${cleanName}`;
    const { data: inserted, error } = await supabase
      .from('professores')
      .insert({
        nome: displayName,
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

    // 6. Fallback se insert não retornou por restrição de unicidade
    const { data: fallbackProf } = await supabase
      .from('professores')
      .select('id')
      .limit(1);
    if (fallbackProf && fallbackProf.length > 0) {
      return fallbackProf[0].id;
    }
  } catch (err) {
    console.warn('Erro em ensureTeacherUuid:', err);
  }

  return null;
}

// Helper para garantir UUID de aluno no Supabase
async function ensureStudentUuid(
  studentId?: string,
  studentName?: string,
  sport?: string,
  teacherIdUuid?: string | null
): Promise<string | null> {
  if (!supabase) return null;

  // 1. Se studentId for um UUID válido, verifica se realmente existe na tabela 'alunos'
  if (studentId && isValidUuid(studentId)) {
    try {
      const { data: sCheck } = await supabase
        .from('alunos')
        .select('id')
        .eq('id', studentId)
        .limit(1);
      if (sCheck && sCheck.length > 0) {
        return sCheck[0].id;
      }
    } catch (err) {
      console.warn('Erro ao verificar UUID de aluno:', err);
    }
  }

  // 2. Tenta determinar o nome do aluno
  let nameToSearch = studentName?.trim();
  if (!nameToSearch && studentId) {
    const foundInMock = INITIAL_STUDENTS.find((s) => s.id === studentId);
    if (foundInMock) {
      nameToSearch = foundInMock.name;
    }
  }

  if (!nameToSearch) return null;

  const cleanName = nameToSearch.trim();
  const sanitizedClean = cleanName.replace(/[^a-zA-Z0-9 áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '').trim();

  try {
    // 3. Tenta buscar pelo nome na tabela alunos
    const { data } = await supabase
      .from('alunos')
      .select('id, nome')
      .ilike('nome', `%${sanitizedClean || cleanName}%`)
      .limit(1);

    if (data && data.length > 0) {
      return data[0].id;
    }

    // 4. Se não encontrou, insere novo aluno na tabela alunos para obter UUID real
    const studentPayload: any = {
      nome: cleanName,
      esporte: sport || 'Futevôlei',
      nivel: 'Iniciante',
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

    // Fallback se erro de inserção
    const { data: fallbackStudent } = await supabase
      .from('alunos')
      .select('id')
      .limit(1);
    if (fallbackStudent && fallbackStudent.length > 0) {
      return fallbackStudent[0].id;
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

    const mappedList = (data || []).map((p) => ({
      id: p.id,
      name: p.nome,
      phone: p.telefone || '',
      sport: p.esporte || 'Futevôlei',
      email: p.email || undefined,
      pricePerClass: Number(p.preco_aula) || 0,
      status: p.status || 'Ativo',
      notes: p.observacoes || undefined,
    }));

    const uniqueMap = new Map<string, Teacher>();
    for (const t of mappedList) {
      const key = t.name.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      }
    }
    return Array.from(uniqueMap.values());
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

export async function dbDeleteTeacher(teacherId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(teacherId)) {
      await supabase.from('professores').delete().eq('id', teacherId);
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir professor no Supabase:', err);
    return false;
  }
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

    const mappedStudents = (data || []).map((a) => ({
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

    const uniqueStudentMap = new Map<string, Student>();
    for (const st of mappedStudents) {
      const key = st.name.trim().toLowerCase();
      if (!uniqueStudentMap.has(key)) {
        uniqueStudentMap.set(key, st);
      }
    }
    return Array.from(uniqueStudentMap.values());
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

export async function dbDeleteStudent(studentId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(studentId)) {
      await supabase.from('alunos').delete().eq('id', studentId);
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir aluno no Supabase:', err);
    return false;
  }
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
        } else {
          if (!aulasMap[bId].teacherId && a.professor_id) {
            aulasMap[bId].teacherId = a.professor_id;
            aulasMap[bId].teacherName = a.professores?.nome || undefined;
          }
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
        const { error: insError } = await supabase.from('aulas').insert(aulaRows);
        if (insError) {
          console.error('Erro ao inserir registros na tabela aulas:', insError);
        }
      } else if (teacherUuid) {
        // Tenta inserir apenas com professor (aluno_id = null)
        const { error: insError } = await supabase.from('aulas').insert([{
          agendamento_id: bookingId,
          professor_id: teacherUuid,
          aluno_id: null
        }]);
        if (insError) {
          console.warn('Erro ao inserir aula sem aluno (pode haver restrição NOT NULL em aluno_id). Tentando vincular aluno padrão:', insError);
          // Fallback: se aluno_id for NOT NULL na tabela 'aulas', busca/cria aluno genérico de apoio
          const fallbackStudentUuid = await ensureStudentUuid(undefined, 'Aluno de Aula', booking.sport, teacherUuid);
          if (fallbackStudentUuid) {
            await supabase.from('aulas').insert([{
              agendamento_id: bookingId,
              professor_id: teacherUuid,
              aluno_id: fallbackStudentUuid
            }]);
          }
        }
      }
    } catch (aulasErr) {
      console.warn('Erro ao sincronizar tabela aulas no Supabase:', aulasErr);
    }
  }

  // 5. Sincroniza os jogadores de racha (jogadores_racha) apenas se a propriedade players for fornecida (Array)
  if (Array.isArray(booking.players)) {
    try {
      // Remove jogadores antigos do agendamento
      await supabase
        .from('jogadores_racha')
        .delete()
        .eq('agendamento_id', bookingId);

      if (booking.players.length > 0) {
        // Insere os novos jogadores (sem passar id fixo para evitar erros de PK no Supabase)
        const dbPlayers = booking.players.map((p) => ({
          agendamento_id: bookingId,
          nome: p.name,
          email: p.email || null,
          telefone: p.phone || null,
          pago: Boolean(p.hasPaid),
          valor: Number(p.amount) || 0,
        }));

        const { error: insError } = await supabase
          .from('jogadores_racha')
          .insert(dbPlayers);

        if (insError) {
          console.error('Erro ao salvar jogadores de racha no Supabase:', insError);
          throw insError;
        }
      }
    } catch (rachaErr) {
      console.error('Erro ao sincronizar jogadores de racha no Supabase:', rachaErr);
      throw rachaErr;
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
  let { data, error } = isUuid
    ? await query.upsert(dbSport).select().single()
    : await query.upsert(dbSport, { onConflict: 'nome' }).select().single();

  if (error && (error.message?.includes('ativo') || error.message?.includes('schema cache') || error.details?.includes('ativo'))) {
    delete dbSport.ativo;
    const retry = isUuid
      ? await query.upsert(dbSport).select().single()
      : await query.upsert(dbSport, { onConflict: 'nome' }).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao salvar esporte no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome || data.name,
      description: data.descricao || data.description || undefined,
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
  if (!supabase) return INITIAL_COURT_TYPES;

  let loadedTypes: CourtTypeItem[] = [];

  // 1. Tenta buscar em tabelas de tipo de quadra no Supabase
  const possibleTables = ['tipos_quadra', 'tipo_quadra', 'tipos_quadras'];
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('nome', { ascending: true });

      if (!error && data && data.length > 0) {
        loadedTypes = data.map((t) => ({
          id: t.id,
          name: t.nome || t.name || t.tipo,
          description: t.descricao || t.description || undefined,
          active: t.ativo ?? t.active ?? true,
        }));
        break;
      }
    } catch (_) {}
  }

  // 2. Extrai tipos de quadra já cadastrados na tabela 'quadras' para garantir total cobertura
  try {
    const { data: quadrasData } = await supabase.from('quadras').select('tipo');
    if (quadrasData && quadrasData.length > 0) {
      const existingNames = new Set(loadedTypes.map((t) => t.name.trim().toLowerCase()));
      for (const q of quadrasData) {
        if (q.tipo && q.tipo.trim() && !existingNames.has(q.tipo.trim().toLowerCase())) {
          existingNames.add(q.tipo.trim().toLowerCase());
          loadedTypes.push({
            id: `type-${q.tipo.trim().toLowerCase().replace(/\s+/g, '-')}`,
            name: q.tipo.trim(),
            description: 'Tipo cadastrado nas quadras da arena',
            active: true,
          });
        }
      }
    }
  } catch (_) {}

  // 3. Se nenhuma quadra/tipo for encontrado no banco, utiliza os dados padrões
  if (loadedTypes.length === 0) {
    return INITIAL_COURT_TYPES;
  }

  // Deduplica por nome
  const uniqueMap = new Map<string, CourtTypeItem>();
  for (const item of loadedTypes) {
    const key = item.name.trim().toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
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

  const possibleTables = ['tipos_quadra', 'tipo_quadra', 'tipos_quadras'];
  let savedData: any = null;
  let lastError: any = null;

  for (const tableName of possibleTables) {
    try {
      const query = supabase.from(tableName);
      let { data, error } = isUuid
        ? await query.upsert(dbType).select().single()
        : await query.upsert(dbType, { onConflict: 'nome' }).select().single();

      if (error && (error.message?.includes('ativo') || error.message?.includes('schema cache') || error.details?.includes('ativo'))) {
        const fallbackType = { ...dbType };
        delete fallbackType.ativo;
        const retry = isUuid
          ? await query.upsert(fallbackType).select().single()
          : await query.upsert(fallbackType, { onConflict: 'nome' }).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        savedData = data;
        break;
      } else {
        lastError = error;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (savedData) {
    return {
      id: savedData.id,
      name: savedData.nome || savedData.name,
      description: savedData.descricao || savedData.description || undefined,
      active: savedData.ativo ?? true,
    };
  }

  if (lastError) {
    console.error('Erro ao salvar tipo de quadra no Supabase:', lastError);
    throw lastError;
  }

  return null;
}

export async function dbDeleteCourtType(courtTypeId: string, courtTypeName?: string): Promise<void> {
  if (!supabase) return;

  const possibleTables = ['tipos_quadra', 'tipo_quadra', 'tipos_quadras'];
  for (const tableName of possibleTables) {
    try {
      const query = supabase.from(tableName).delete();
      if (isValidUuid(courtTypeId)) {
        await query.eq('id', courtTypeId);
      } else {
        await query.eq('nome', courtTypeName || courtTypeId);
      }
    } catch (_) {}
  }
}

// ====================================================================
// TIPOS DE ALUGUEL / AGENDAMENTO (tabela: tipos_aluguel)
// ====================================================================

export async function dbGetRentalTypes(): Promise<RentalType[]> {
  if (!supabase) return INITIAL_RENTAL_TYPES;
  try {
    const { data, error } = await supabase
      .from('tipos_aluguel')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        name: t.nome,
        description: t.descricao || undefined,
        isDefault: t.is_default ?? false,
      }));
    }
  } catch (_) {}

  try {
    const { data, error } = await supabase
      .from('tipos_agendamento')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        name: t.nome,
        description: t.descricao || undefined,
        isDefault: t.is_default ?? false,
      }));
    }
  } catch (_) {}

  return INITIAL_RENTAL_TYPES;
}

export async function dbSaveRentalType(rentalType: RentalType): Promise<RentalType | null> {
  if (!supabase) return null;

  const dbItem: any = {
    nome: rentalType.name,
    descricao: rentalType.description || null,
    is_default: rentalType.isDefault ?? false,
  };

  if (isValidUuid(rentalType.id)) {
    dbItem.id = rentalType.id;
  }

  let { data, error } = await supabase
    .from('tipos_aluguel')
    .upsert(dbItem, { onConflict: 'nome' })
    .select()
    .single();

  if (error) {
    const res = await supabase
      .from('tipos_agendamento')
      .upsert(dbItem, { onConflict: 'nome' })
      .select()
      .single();
    data = res.data;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      description: data.descricao || undefined,
      isDefault: data.is_default ?? false,
    };
  }

  return null;
}

export async function dbDeleteRentalType(id: string, name?: string): Promise<void> {
  if (!supabase) return;
  try {
    const q1 = supabase.from('tipos_aluguel').delete();
    if (isValidUuid(id)) await q1.eq('id', id);
    else await q1.eq('nome', name || id);
  } catch (_) {}

  try {
    const q2 = supabase.from('tipos_agendamento').delete();
    if (isValidUuid(id)) await q2.eq('id', id);
    else await q2.eq('nome', name || id);
  } catch (_) {}
}

// ====================================================================
// TIMES & MEMBROS DE TIME (tabelas: times, membros_time)
// ====================================================================

export async function dbGetTeams(): Promise<Team[]> {
  if (!supabase) return [];
  try {
    const { data: tData, error: tError } = await supabase
      .from('times')
      .select('*')
      .order('nome', { ascending: true });

    if (tError || !tData) return [];

    const { data: mData } = await supabase
      .from('membros_time')
      .select('*');

    const membersMap: Record<string, TeamMember[]> = {};
    (mData || []).forEach((m) => {
      if (!membersMap[m.time_id]) {
        membersMap[m.time_id] = [];
      }
      membersMap[m.time_id].push({
        id: m.id,
        name: m.nome,
        email: m.email || undefined,
        phone: m.telefone || undefined,
        position: m.posicao || undefined,
        notes: m.observacoes || undefined,
      });
    });

    return tData.map((t) => ({
      id: t.id,
      name: t.nome,
      sport: t.esporte || 'Beach Tennis',
      description: t.descricao || undefined,
      members: membersMap[t.id] || [],
      createdAt: t.criado_em || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar times do Supabase:', err);
    return [];
  }
}

export async function dbSaveTeam(team: Team): Promise<Team | null> {
  if (!supabase) return null;

  const dbTeam: any = {
    nome: team.name,
    esporte: team.sport || 'Beach Tennis',
    descricao: team.description || null,
  };

  if (isValidUuid(team.id)) {
    dbTeam.id = team.id;
  }

  const { data: savedTeam, error: tErr } = await supabase
    .from('times')
    .upsert(dbTeam)
    .select()
    .single();

  if (tErr || !savedTeam) {
    console.error('Erro ao salvar time no Supabase:', tErr);
    throw tErr;
  }

  const teamId = savedTeam.id;

  // Sincroniza membros do time
  try {
    await supabase.from('membros_time').delete().eq('time_id', teamId);

    if (team.members && team.members.length > 0) {
      const rows = team.members.map((m) => ({
        time_id: teamId,
        nome: m.name,
        email: m.email || null,
        telefone: m.phone || null,
        posicao: m.position || null,
        observacoes: m.notes || null,
      }));
      await supabase.from('membros_time').insert(rows);
    }
  } catch (mErr) {
    console.error('Erro ao salvar membros do time:', mErr);
  }

  return {
    ...team,
    id: teamId,
  };
}

export async function dbDeleteTeam(teamId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(teamId)) {
      await supabase.from('membros_time').delete().eq('time_id', teamId);
      await supabase.from('times').delete().eq('id', teamId);
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir time do Supabase:', err);
    return false;
  }
}

// ====================================================================
// PERGUNTAS DE AVALIAÇÃO (tabela: perguntas_avaliacao)
// ====================================================================

export async function dbGetAwardQuestions(): Promise<AwardQuestion[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('perguntas_avaliacao')
      .select('*')
      .order('criado_em', { ascending: true });

    if (error || !data) return [];

    return data.map((q) => ({
      id: q.id,
      title: q.titulo,
      subtitle: q.subtitulo || '',
      iconName: q.icone || 'Crown',
      sport: q.esporte || 'Todos',
      active: q.ativo ?? true,
      createdAt: q.criado_em || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar perguntas de avaliação:', err);
    return [];
  }
}

export async function dbSaveAwardQuestion(q: AwardQuestion): Promise<AwardQuestion | null> {
  if (!supabase) return null;

  const dbQuestion: any = {
    titulo: q.title,
    subtitulo: q.subtitle || null,
    icone: q.iconName || 'Crown',
    esporte: q.sport || 'Todos',
    ativo: q.active ?? true,
  };

  if (isValidUuid(q.id)) {
    dbQuestion.id = q.id;
  }

  const { data, error } = await supabase
    .from('perguntas_avaliacao')
    .upsert(dbQuestion)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar pergunta de avaliação:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.titulo,
    subtitle: data.subtitulo || '',
    iconName: data.icone || 'Crown',
    sport: data.esporte || 'Todos',
    active: data.ativo ?? true,
    createdAt: data.criado_em || undefined,
  };
}

export async function dbDeleteAwardQuestion(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(id)) {
      await supabase.from('perguntas_avaliacao').delete().eq('id', id);
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir pergunta de avaliação:', err);
    return false;
  }
}

// ====================================================================
// SCRIPT SQL DDL COMPLETO DAS TABELAS DO SISTEMA
// ====================================================================

export const SQL_SCHEMA_SCRIPT = `-- ============================================================
-- SCRIPT DE CRIAÇÃO DAS TABELAS DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Arena Esportiva - Gestão de Agendamentos, Quadras, Aulas, Times e Avaliações
-- ============================================================

-- Habilita extensão pgcrypto para UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE QUADRAS
CREATE TABLE IF NOT EXISTS public.quadras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'Areia',
    status TEXT NOT NULL DEFAULT 'Disponível',
    preco_por_hora NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'Usuário',
    email TEXT,
    telefone TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ESPORTES
CREATE TABLE IF NOT EXISTS public.esportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE TIPOS DE QUADRA
CREATE TABLE IF NOT EXISTS public.tipos_quadra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE TIPOS DE ALUGUEL / AGENDAMENTO
CREATE TABLE IF NOT EXISTS public.tipos_aluguel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE PROFESSORES
CREATE TABLE IF NOT EXISTS public.professores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    esporte TEXT DEFAULT 'Futevôlei',
    email TEXT,
    preco_aula NUMERIC(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'Ativo',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE ALUNOS
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    esporte TEXT DEFAULT 'Futevôlei',
    nivel TEXT DEFAULT 'Iniciante',
    professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Ativo',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quadra_id UUID REFERENCES public.quadras(id) ON DELETE CASCADE,
    nome_cliente TEXT NOT NULL,
    telefone_cliente TEXT,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    esporte TEXT NOT NULL DEFAULT 'Vôlei de Areia',
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status_pagamento TEXT NOT NULL DEFAULT 'Pendente',
    metodo_pagamento TEXT NOT NULL DEFAULT 'Pix',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE AULAS (Relacionamento entre Agendamento, Professor e Aluno)
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE JOGADORES DO RACHA / PARTIDA
CREATE TABLE IF NOT EXISTS public.jogadores_racha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    pago BOOLEAN DEFAULT FALSE,
    valor NUMERIC(10,2) DEFAULT 0.00,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA DE TIMES (CADASTRO DE EQUIPES)
CREATE TABLE IF NOT EXISTS public.times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    esporte TEXT NOT NULL DEFAULT 'Beach Tennis',
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABELA DE MEMBROS DO TIME (PARTICIPANTES DO TIME)
CREATE TABLE IF NOT EXISTS public.membros_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_id UUID REFERENCES public.times(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    posicao TEXT,
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABELA DE PERGUNTAS DE AVALIAÇÃO / CATEGORIAS DE PREMIAÇÃO
CREATE TABLE IF NOT EXISTS public.perguntas_avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    icone TEXT DEFAULT 'Crown',
    esporte TEXT DEFAULT 'Todos',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABELA DE AVALIAÇÕES / VOTOS DOS JOGADORES PÓS-JOGO
CREATE TABLE IF NOT EXISTS public.avaliacoes_jogadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    avaliador_nome TEXT NOT NULL,
    jogador_avaliado_nome TEXT NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    categoria_id TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voto_partida UNIQUE (agendamento_id, avaliador_nome, jogador_avaliado_nome)
);

-- ============================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_quadra ON public.agendamentos(quadra_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_racha_agendamento ON public.jogadores_racha(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_membros_time_time ON public.membros_time(time_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_agendamento ON public.avaliacoes_jogadores(agendamento_id);
`;


