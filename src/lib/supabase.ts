import { createClient } from '@supabase/supabase-js';
import { Court, Booking, BookingStudent, User, Player, PlayerRating, Sport, CourtTypeItem, RentalType, Teacher, Student, Team, TeamMember, AwardQuestion, Torcedor, AvaliacaoJogo, BarProduct, BarCategoryItem, BarComanda, BarComandaItem, BarSale, BarSaleItem, StockMovement, BarPurchase, BarPurchaseItem, Jogador, EquipeJogador, EquipeMembro, SorteioHistorico } from '../types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS, INITIAL_COURT_TYPES, INITIAL_RENTAL_TYPES } from '../data/mockData';
import { INITIAL_BAR_PRODUCTS, INITIAL_BAR_CATEGORIES } from '../data/mockBarData';

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
        ind_cadastro_ativo: 1,
        observacoes: t.notes || null,
      }));
      await supabase.from('professores').insert(toInsert);

      const { data: reData } = await supabase
        .from('professores')
        .select('*')
        .order('nome', { ascending: true });

      if (reData && reData.length > 0) {
        return reData
          .filter((p) => p.ind_cadastro_ativo !== 0)
          .map((p) => ({
            id: p.id,
            name: p.nome,
            phone: p.telefone || '',
            sport: p.esporte || 'Futevôlei',
            email: p.email || undefined,
            pricePerClass: Number(p.preco_aula) || 0,
            status: p.status || 'Ativo',
            ind_cadastro_ativo: p.ind_cadastro_ativo !== undefined && p.ind_cadastro_ativo !== null ? Number(p.ind_cadastro_ativo) : 1,
            notes: p.observacoes || undefined,
          }));
      }
    }

    // Filtrar apenas professores com ind_cadastro_ativo igual a 1 (ou diferente de 0)
    const activeProfessores = (data || []).filter((p) => p.ind_cadastro_ativo !== 0);

    const mappedList = activeProfessores.map((p) => ({
      id: p.id,
      name: p.nome,
      phone: p.telefone || '',
      sport: p.esporte || 'Futevôlei',
      email: p.email || undefined,
      pricePerClass: Number(p.preco_aula) || 0,
      status: p.status || 'Ativo',
      ind_cadastro_ativo: p.ind_cadastro_ativo !== undefined && p.ind_cadastro_ativo !== null ? Number(p.ind_cadastro_ativo) : 1,
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
    ind_cadastro_ativo: teacher.ind_cadastro_ativo !== undefined ? teacher.ind_cadastro_ativo : 1,
    observacoes: teacher.notes || null,
  };

  const isUuid = isValidUuid(teacher.id);
  if (isUuid) {
    dbProf.id = teacher.id;
  }

  const query = supabase.from('professores');
  let data: any = null;
  let error: any = null;

  if (isUuid) {
    const res = await query.upsert(dbProf).select().single();
    data = res.data;
    error = res.error;
  } else {
    // Tenta atualizar se já existe pelo nome ou insere novo
    const { data: existing } = await supabase.from('professores').select('id').ilike('nome', teacher.name.trim()).maybeSingle();
    if (existing?.id) {
      dbProf.id = existing.id;
      const res = await supabase.from('professores').update(dbProf).eq('id', existing.id).select().single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase.from('professores').insert(dbProf).select().single();
      data = res.data;
      error = res.error;
    }
  }

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
      ind_cadastro_ativo: data.ind_cadastro_ativo !== undefined && data.ind_cadastro_ativo !== null ? Number(data.ind_cadastro_ativo) : 1,
      notes: data.observacoes || undefined,
    };
  }

  return null;
}

export async function dbDeleteTeacher(teacherId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Soft delete: Atualiza ind_cadastro_ativo para 0
    if (isValidUuid(teacherId)) {
      const { error } = await supabase
        .from('professores')
        .update({ ind_cadastro_ativo: 0 })
        .eq('id', teacherId);
      if (error) {
        console.warn('Tentativa com update falhou, tentando excluir fisicamente se campo não existir:', error);
        await supabase.from('professores').delete().eq('id', teacherId);
      }
    } else {
      const { error } = await supabase
        .from('professores')
        .update({ ind_cadastro_ativo: 0 })
        .ilike('nome', teacherId);
      if (error) {
        console.warn('Tentativa com update falhou, tentando excluir fisicamente se campo não existir:', error);
        await supabase.from('professores').delete().ilike('nome', teacherId);
      }
    }
    return true;
  } catch (err) {
    console.error('Erro ao inativar professor no Supabase:', err);
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
        mensalidade: Number(s.monthlyFee) || 240,
        ind_cadastro_ativo: 1,
        observacoes: s.notes || null,
      }));
      await supabase.from('alunos').insert(toInsert);

      const { data: reData } = await supabase
        .from('alunos')
        .select('*, professores(nome)')
        .order('nome', { ascending: true });

      if (reData && reData.length > 0) {
        return reData
          .filter((a) => a.ind_cadastro_ativo !== 0)
          .map((a) => ({
            id: a.id,
            name: a.nome,
            phone: a.telefone || '',
            sport: a.esporte || 'Futevôlei',
            level: a.nivel || 'Iniciante',
            teacherId: a.professor_id || undefined,
            teacherName: a.professores?.nome || undefined,
            status: a.status || 'Ativo',
            ind_cadastro_ativo: a.ind_cadastro_ativo !== undefined && a.ind_cadastro_ativo !== null ? Number(a.ind_cadastro_ativo) : 1,
            monthlyFee: Number(a.mensalidade ?? a.valor_mensalidade ?? a.valor ?? 240),
            notes: a.observacoes || undefined,
          }));
      }
    }

    const mappedStudents = (data || [])
      .filter((a) => a.ind_cadastro_ativo !== 0)
      .map((a) => ({
        id: a.id,
        name: a.nome,
        phone: a.telefone || '',
        sport: a.esporte || 'Futevôlei',
        level: a.nivel || 'Iniciante',
        teacherId: a.professor_id || undefined,
        teacherName: a.professores?.nome || undefined,
        status: a.status || 'Ativo',
        ind_cadastro_ativo: a.ind_cadastro_ativo !== undefined && a.ind_cadastro_ativo !== null ? Number(a.ind_cadastro_ativo) : 1,
        monthlyFee: Number(a.mensalidade ?? a.valor_mensalidade ?? a.valor ?? 240),
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

  const feeValue = student.monthlyFee !== undefined && student.monthlyFee !== null
    ? Number(student.monthlyFee)
    : 240;

  const dbAluno: any = {
    nome: student.name.trim(),
    telefone: student.phone || null,
    esporte: student.sport || 'Futevôlei',
    nivel: student.level || 'Iniciante',
    professor_id: isValidUuid(student.teacherId || '') ? student.teacherId : null,
    status: student.status || 'Ativo',
    mensalidade: feeValue,
    ind_cadastro_ativo: student.ind_cadastro_ativo !== undefined ? student.ind_cadastro_ativo : 1,
    observacoes: student.notes || null,
  };

  const isUuid = isValidUuid(student.id);
  if (isUuid) {
    dbAluno.id = student.id;
  }

  let data: any = null;
  let error: any = null;

  const executeSave = async (payload: any) => {
    if (isUuid) {
      return await supabase!.from('alunos').upsert(payload).select('*, professores(nome)').single();
    } else {
      const { data: existing } = await supabase!.from('alunos').select('id').ilike('nome', student.name.trim()).maybeSingle();
      if (existing?.id) {
        payload.id = existing.id;
        return await supabase!.from('alunos').update(payload).eq('id', existing.id).select('*, professores(nome)').single();
      } else {
        return await supabase!.from('alunos').insert(payload).select('*, professores(nome)').single();
      }
    }
  };

  let res = await executeSave(dbAluno);
  data = res.data;
  error = res.error;

  // Se der erro por coluna com nome alternativo de mensalidade ou ind_cadastro_ativo, tentar com fallbacks
  if (error) {
    console.warn('Erro na primeira tentativa de salvar aluno:', error);
    const errMessage = (error.message || '').toLowerCase();
    
    // Tentar fallback se 'mensalidade' falhou
    if (errMessage.includes('mensalidade')) {
      const retryPayload = { ...dbAluno };
      delete retryPayload.mensalidade;
      retryPayload.valor_mensalidade = feeValue;
      res = await executeSave(retryPayload);
      if (!res.error) {
        data = res.data;
        error = null;
      }
    }

    // Se ainda com erro e menciona ind_cadastro_ativo
    if (error && (error.message || '').toLowerCase().includes('ind_cadastro_ativo')) {
      const retryPayload = { ...dbAluno };
      delete retryPayload.ind_cadastro_ativo;
      res = await executeSave(retryPayload);
      if (!res.error) {
        data = res.data;
        error = null;
      }
    }
  }

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
      teacherName: data.professores?.nome || student.teacherName || undefined,
      status: data.status || 'Ativo',
      ind_cadastro_ativo: data.ind_cadastro_ativo !== undefined && data.ind_cadastro_ativo !== null ? Number(data.ind_cadastro_ativo) : 1,
      monthlyFee: Number(data.mensalidade ?? data.valor_mensalidade ?? data.valor ?? feeValue),
      notes: data.observacoes || undefined,
    };
  }

  return null;
}

export async function dbDeleteStudent(studentId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(studentId)) {
      const { error } = await supabase
        .from('alunos')
        .update({ ind_cadastro_ativo: 0 })
        .eq('id', studentId);
      if (error) {
        console.warn('Tentativa de soft delete falhou no Supabase, tentando exclusão física:', error);
        await supabase.from('alunos').delete().eq('id', studentId);
      }
    } else {
      const { error } = await supabase
        .from('alunos')
        .update({ ind_cadastro_ativo: 0 })
        .ilike('nome', studentId);
      if (error) {
        console.warn('Tentativa de soft delete falhou no Supabase, tentando exclusão física:', error);
        await supabase.from('alunos').delete().ilike('nome', studentId);
      }
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir/inativar aluno no Supabase:', err);
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
// JOGADORES DO RACHA/AGENDAMENTO (tabela: jogadores_agendamento / fallback)
// ====================================================================

export async function dbGetBookingJogadores(bookingId?: string): Promise<Player[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('jogadores_agendamento').select('*').order('nome', { ascending: true });
    if (bookingId && isValidUuid(bookingId)) {
      query = query.eq('agendamento_id', bookingId);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((j) => ({
      id: j.id,
      name: j.nome,
      email: j.email || undefined,
      phone: j.telefone || undefined,
      hasPaid: j.pago ?? false,
      amount: Number(j.valor) || 0,
    }));
  } catch (err) {
    console.warn('Erro ao buscar jogadores do agendamento:', err);
    return [];
  }
}

export async function dbSaveBookingJogador(player: Player, bookingId?: string): Promise<Player | null> {
  if (!supabase) return null;

  const dbPlayer: any = {
    nome: player.name,
    email: player.email || null,
    telefone: player.phone || null,
    pago: Boolean(player.hasPaid),
    valor: Number(player.amount) || 0,
  };

  if (bookingId && isValidUuid(bookingId)) {
    dbPlayer.agendamento_id = bookingId;
  }

  if (isValidUuid(player.id)) {
    dbPlayer.id = player.id;
  }

  const { data, error } = await supabase
    .from('jogadores_agendamento')
    .upsert(dbPlayer)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar jogador do agendamento:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.nome,
    email: data.email || undefined,
    phone: data.telefone || undefined,
    hasPaid: data.pago ?? false,
    amount: Number(data.valor) || 0,
  };
}

export async function dbDeleteJogador(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isValidUuid(id)) {
      await supabase.from('jogadores').delete().eq('id', id);
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir jogador:', err);
    return false;
  }
}

// ====================================================================
// TORCEDORES (tabela: torcedores)
// ====================================================================

export async function dbGetTorcedores(bookingId?: string): Promise<Torcedor[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('torcedores').select('*').order('nome', { ascending: true });
    if (bookingId && isValidUuid(bookingId)) {
      query = query.eq('agendamento_id', bookingId);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((t) => ({
      id: t.id,
      name: t.nome,
      email: t.email || undefined,
      phone: t.telefone || undefined,
      favoriteTeam: t.time_favorito || undefined,
      bookingId: t.agendamento_id || undefined,
      createdAt: t.criado_em || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar torcedores:', err);
    return [];
  }
}

export async function dbSaveTorcedor(torcedor: Partial<Torcedor> & { name: string }): Promise<Torcedor | null> {
  if (!supabase) return null;

  const dbTorcedor: any = {
    nome: torcedor.name,
    email: torcedor.email || null,
    telefone: torcedor.phone || null,
    time_favorito: torcedor.favoriteTeam || null,
  };

  if (torcedor.bookingId && isValidUuid(torcedor.bookingId)) {
    dbTorcedor.agendamento_id = torcedor.bookingId;
  }

  if (torcedor.id && isValidUuid(torcedor.id)) {
    dbTorcedor.id = torcedor.id;
  }

  const { data, error } = await supabase
    .from('torcedores')
    .upsert(dbTorcedor)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar torcedor:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.nome,
    email: data.email || undefined,
    phone: data.telefone || undefined,
    favoriteTeam: data.time_favorito || undefined,
    bookingId: data.agendamento_id || undefined,
    createdAt: data.criado_em || undefined,
  };
}

// ====================================================================
// AVALIAÇÃO DO JOGO (tabela: avaliacao_jogo)
// ====================================================================

export async function dbGetAvaliacoesJogo(bookingId?: string): Promise<AvaliacaoJogo[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('avaliacao_jogo').select('*').order('criado_em', { ascending: false });
    if (bookingId && isValidUuid(bookingId)) {
      query = query.eq('agendamento_id', bookingId);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((a) => ({
      id: a.id,
      bookingId: a.agendamento_id,
      voterType: a.tipo_voter === 'torcedor' ? 'torcedor' : 'jogador',
      jogadorId: a.jogador_id || undefined,
      torcedorId: a.torcedor_id || undefined,
      evaluatorName: a.avaliador_nome || undefined,
      perguntaId: a.pergunta_id || undefined,
      ratedPlayerName: a.jogador_avaliado_nome || undefined,
      rating: Number(a.nota) || 5.0,
      notes: a.observacao || undefined,
      createdAt: a.criado_em || undefined,
    }));
  } catch (err) {
    console.warn('Erro ao buscar avaliações do jogo:', err);
    return [];
  }
}

export async function dbSaveAvaliacaoJogo(evalItem: Partial<AvaliacaoJogo> & { bookingId: string, rating: number }): Promise<AvaliacaoJogo | null> {
  if (!supabase) return null;

  const dbEval: any = {
    agendamento_id: evalItem.bookingId,
    tipo_voter: evalItem.voterType || 'jogador',
    avaliador_nome: evalItem.evaluatorName || null,
    jogador_avaliado_nome: evalItem.ratedPlayerName || null,
    nota: evalItem.rating,
    observacao: evalItem.notes || null,
  };

  if (evalItem.jogadorId && isValidUuid(evalItem.jogadorId)) {
    dbEval.jogador_id = evalItem.jogadorId;
  }
  if (evalItem.torcedorId && isValidUuid(evalItem.torcedorId)) {
    dbEval.torcedor_id = evalItem.torcedorId;
  }
  if (evalItem.perguntaId && isValidUuid(evalItem.perguntaId)) {
    dbEval.pergunta_id = evalItem.perguntaId;
  }
  if (evalItem.id && isValidUuid(evalItem.id)) {
    dbEval.id = evalItem.id;
  }

  // Delete previous vote for this evaluator on this question in this booking if changing votes
  if (dbEval.agendamento_id && dbEval.avaliador_nome) {
    try {
      let delQuery = supabase
        .from('avaliacao_jogo')
        .delete()
        .eq('agendamento_id', dbEval.agendamento_id)
        .eq('avaliador_nome', dbEval.avaliador_nome);
      if (dbEval.pergunta_id) {
        delQuery = delQuery.eq('pergunta_id', dbEval.pergunta_id);
      }
      await delQuery;
    } catch (e) {
      console.warn('Aviso ao remover voto anterior:', e);
    }
  }

  const { data, error } = await supabase
    .from('avaliacao_jogo')
    .insert(dbEval)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar avaliação do jogo:', error);
    return null;
  }

  return {
    id: data.id,
    bookingId: data.agendamento_id,
    voterType: data.tipo_voter,
    jogadorId: data.jogador_id || undefined,
    torcedorId: data.torcedor_id || undefined,
    evaluatorName: data.avaliador_nome || undefined,
    perguntaId: data.pergunta_id || undefined,
    ratedPlayerName: data.jogador_avaliado_nome || undefined,
    rating: Number(data.nota),
    notes: data.observacao || undefined,
    createdAt: data.criado_em || undefined,
  };
}

// ====================================================================
// BAR & GESTÃO DE VENDAS / PRODUTOS / CATEGORIAS / COMANDAS / ESTOQUE
// ====================================================================

// Categorias de Produtos do Bar
export function checkIsCategoryActive(c: any): boolean {
  if (!c) return false;
  if (c.ind_cadastro_ativo !== undefined && c.ind_cadastro_ativo !== null) {
    if (typeof c.ind_cadastro_ativo === 'boolean') {
      return c.ind_cadastro_ativo === true;
    }
    const valStr = String(c.ind_cadastro_ativo).trim().toLowerCase();
    return valStr === 'true' || valStr === '1' || valStr === 't';
  }
  if (c.status_ativo !== undefined && c.status_ativo !== null) {
    if (typeof c.status_ativo === 'boolean') {
      return c.status_ativo === true;
    }
    const valStr = String(c.status_ativo).trim().toLowerCase();
    return valStr === 'true' || valStr === '1' || valStr === 't';
  }
  return true;
}

export async function dbGetBarCategories(): Promise<BarCategoryItem[]> {
  if (!supabase) return INITIAL_BAR_CATEGORIES;
  try {
    const { data, error } = await supabase
      .from('categorias_produtos_bar')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data && data.length > 0) {
      return data
        .filter((c: any) => checkIsCategoryActive(c))
        .map((c: any) => ({
          id: String(c.id),
          name: c.nome,
          description: c.descricao || undefined,
          color: c.cor || undefined,
          icon: c.icone || undefined,
          ind_cadastro_ativo: c.ind_cadastro_ativo !== undefined ? (typeof c.ind_cadastro_ativo === 'boolean' ? c.ind_cadastro_ativo : (Number(c.ind_cadastro_ativo) === 1 || String(c.ind_cadastro_ativo).toLowerCase() === 'true')) : true,
          status_ativo: c.status_ativo !== undefined ? (typeof c.status_ativo === 'boolean' ? (c.status_ativo ? 1 : 0) : Number(c.status_ativo)) : 1,
          createdAt: c.criado_em
        }));
    }

    // Tenta tabela alternativa caso criada com nome simplificado
    const { data: altData, error: altErr } = await supabase
      .from('categorias_bar')
      .select('*')
      .order('nome', { ascending: true });

    if (!altErr && altData && altData.length > 0) {
      return altData
        .filter((c: any) => checkIsCategoryActive(c))
        .map((c: any) => ({
          id: String(c.id),
          name: c.nome,
          description: c.descricao || undefined,
          color: c.cor || undefined,
          icon: c.icone || undefined,
          ind_cadastro_ativo: c.ind_cadastro_ativo !== undefined ? (typeof c.ind_cadastro_ativo === 'boolean' ? c.ind_cadastro_ativo : (Number(c.ind_cadastro_ativo) === 1 || String(c.ind_cadastro_ativo).toLowerCase() === 'true')) : true,
          status_ativo: c.status_ativo !== undefined ? (typeof c.status_ativo === 'boolean' ? (c.status_ativo ? 1 : 0) : Number(c.status_ativo)) : 1,
          createdAt: c.criado_em
        }));
    }

    return INITIAL_BAR_CATEGORIES;
  } catch (err) {
    console.warn('Erro ao carregar categorias do bar do Supabase:', err);
    return INITIAL_BAR_CATEGORIES;
  }
}

export async function dbSaveBarCategory(category: BarCategoryItem): Promise<BarCategoryItem | null> {
  if (!supabase) return category;
  try {
    const isCurrentlyActive = checkIsCategoryActive(category);
    const catId = category.id || `cat-${Date.now()}`;

    const dbCat: any = {
      id: catId,
      nome: category.name.trim(),
      descricao: category.description?.trim() || null,
      cor: category.color || null,
      icone: category.icon || null,
      ind_cadastro_ativo: isCurrentlyActive,
      status_ativo: isCurrentlyActive ? 1 : 0,
      atualizado_em: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('categorias_produtos_bar')
      .upsert(dbCat, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Se der erro de tipo booleano vs inteiro, tenta com 1/0
      const dbCatNum: any = {
        ...dbCat,
        ind_cadastro_ativo: isCurrentlyActive ? 1 : 0
      };
      const resNum = await supabase.from('categorias_produtos_bar').upsert(dbCatNum, { onConflict: 'id' }).select().single();
      if (!resNum.error && resNum.data) {
        data = resNum.data;
        error = null;
      }
    }

    if (error) {
      // Tenta na tabela alternativa
      const altRes = await supabase
        .from('categorias_bar')
        .upsert(dbCat, { onConflict: 'id' })
        .select()
        .single();
      if (!altRes.error && altRes.data) {
        data = altRes.data;
        error = null;
      }
    }

    if (data) {
      return {
        id: String(data.id),
        name: data.nome,
        description: data.descricao || undefined,
        color: data.cor || undefined,
        icon: data.icone || undefined,
        ind_cadastro_ativo: data.ind_cadastro_ativo !== undefined ? (typeof data.ind_cadastro_ativo === 'boolean' ? data.ind_cadastro_ativo : (Number(data.ind_cadastro_ativo) === 1 || String(data.ind_cadastro_ativo).toLowerCase() === 'true')) : true,
        status_ativo: data.status_ativo !== undefined ? (typeof data.status_ativo === 'boolean' ? (data.status_ativo ? 1 : 0) : Number(data.status_ativo)) : 1,
        createdAt: data.criado_em
      };
    }
  } catch (err) {
    console.warn('Erro ao salvar categoria no Supabase:', err);
  }
  return category;
}

export async function dbDeleteBarCategory(categoryId: string, categoryName?: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const timestamp = new Date().toISOString();

    // Tenta atualizar ind_cadastro_ativo = false / 0 na tabela categorias_produtos_bar
    if (categoryId) {
      const resBool = await supabase.from('categorias_produtos_bar').update({ ind_cadastro_ativo: false, status_ativo: 0, atualizado_em: timestamp }).eq('id', categoryId);
      if (resBool.error) {
        await supabase.from('categorias_produtos_bar').update({ ind_cadastro_ativo: 0, status_ativo: 0, atualizado_em: timestamp }).eq('id', categoryId);
      }
    }
    if (categoryName) {
      const resBool = await supabase.from('categorias_produtos_bar').update({ ind_cadastro_ativo: false, status_ativo: 0, atualizado_em: timestamp }).eq('nome', categoryName.trim());
      if (resBool.error) {
        await supabase.from('categorias_produtos_bar').update({ ind_cadastro_ativo: 0, status_ativo: 0, atualizado_em: timestamp }).eq('nome', categoryName.trim());
      }
    }

    // Tenta também em categorias_bar
    if (categoryId) {
      await supabase.from('categorias_bar').update({ ind_cadastro_ativo: false, status_ativo: 0, atualizado_em: timestamp }).eq('id', categoryId);
    }
    if (categoryName) {
      await supabase.from('categorias_bar').update({ ind_cadastro_ativo: false, status_ativo: 0, atualizado_em: timestamp }).eq('nome', categoryName.trim());
    }

    return true;
  } catch (err) {
    console.warn('Erro ao inativar categoria no Supabase:', err);
    return false;
  }
}

export async function dbGetBarProducts(): Promise<BarProduct[]> {
  if (!supabase) return INITIAL_BAR_PRODUCTS;
  try {
    const { data, error } = await supabase
      .from('produtos_bar')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar produtos do bar no Supabase:', error);
      return INITIAL_BAR_PRODUCTS;
    }

    if (!data || data.length === 0) {
      try {
        const toInsert = INITIAL_BAR_PRODUCTS.map(p => ({
          id: p.id,
          nome: p.name,
          categoria: p.category,
          preco: Number(p.price) || 0,
          preco_custo: Number(p.costPrice) || 0,
          estoque: Number(p.stock) || 0,
          estoque_minimo: Number(p.minStock) || 5,
          unidade: p.unit || 'un',
          descricao: p.description || null,
          ativo: p.active ?? true,
          status_ativo: 1,
          url_imagem: p.imageUrl || null
        }));
        await supabase.from('produtos_bar').insert(toInsert);

        const { data: reData } = await supabase
          .from('produtos_bar')
          .select('*')
          .order('nome', { ascending: true });

        if (reData && reData.length > 0) {
          const activeReData = reData.filter(p => p.status_ativo !== 0 && p.status_ativo !== '0' && p.ativo !== false);
          return activeReData.map(p => ({
            id: p.id,
            name: p.nome,
            category: p.categoria,
            price: Number(p.preco) || 0,
            costPrice: Number(p.preco_custo) || 0,
            stock: Number(p.estoque) || 0,
            minStock: Number(p.estoque_minimo) || 5,
            unit: p.unidade || 'un',
            description: p.descricao || undefined,
            active: true,
            status_ativo: 1,
            imageUrl: p.url_imagem || undefined
          }));
        }
      } catch (insErr) {
        console.warn('Aviso ao inicializar produtos no banco:', insErr);
      }
      return INITIAL_BAR_PRODUCTS;
    }

    // Filtrar apenas produtos ativos (status_ativo <> 0 e ativo <> false)
    const activeProducts = data.filter(p => p.status_ativo !== 0 && p.status_ativo !== '0' && p.ativo !== false);

    return activeProducts.map(p => ({
      id: p.id,
      name: p.nome,
      category: p.categoria,
      price: Number(p.preco) || 0,
      costPrice: Number(p.preco_custo) || 0,
      lastPurchasePrice: Number(p.ultimo_preco_compra) || Number(p.preco_custo) || 0,
      totalPurchasedQty: Number(p.total_comprado_acumulado) || 0,
      stock: Number(p.estoque) || 0,
      minStock: Number(p.estoque_minimo) || 5,
      unit: p.unidade || 'un',
      description: p.descricao || undefined,
      active: true,
      status_ativo: p.status_ativo !== undefined ? Number(p.status_ativo) : 1,
      imageUrl: p.url_imagem || undefined
    }));
  } catch (err) {
    console.warn('Erro ao carregar produtos no Supabase:', err);
    return INITIAL_BAR_PRODUCTS;
  }
}

export async function dbSaveBarProduct(product: BarProduct): Promise<BarProduct | null> {
  if (!supabase) return null;

  // Ao cadastrar ou salvar um produto, inserir status_ativo = 1 (ou 0 caso inativado)
  const isCurrentlyActive = product.status_ativo !== undefined ? product.status_ativo !== 0 : product.active !== false;
  const statusAtivoValue = isCurrentlyActive ? 1 : 0;

  const dbProduct: any = {
    id: product.id,
    nome: product.name,
    categoria: product.category,
    preco: Number(product.price) || 0,
    preco_custo: Number(product.costPrice) || 0,
    ultimo_preco_compra: Number(product.lastPurchasePrice) || Number(product.costPrice) || 0,
    total_comprado_acumulado: Number(product.totalPurchasedQty) || 0,
    estoque: Number(product.stock) || 0,
    estoque_minimo: Number(product.minStock) || 5,
    unidade: product.unit || 'un',
    descricao: product.description || null,
    ativo: isCurrentlyActive,
    status_ativo: statusAtivoValue,
    url_imagem: product.imageUrl || null,
    atualizado_em: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('produtos_bar')
    .upsert(dbProduct)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar produto do bar no Supabase:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      name: data.nome,
      category: data.categoria,
      price: Number(data.preco) || 0,
      costPrice: Number(data.preco_custo) || 0,
      lastPurchasePrice: Number(data.ultimo_preco_compra) || Number(data.preco_custo) || 0,
      totalPurchasedQty: Number(data.total_comprado_acumulado) || 0,
      stock: Number(data.estoque) || 0,
      minStock: Number(data.estoque_minimo) || 5,
      unit: data.unidade || 'un',
      description: data.descricao || undefined,
      active: data.status_ativo !== 0 && data.ativo !== false,
      status_ativo: data.status_ativo !== undefined ? Number(data.status_ativo) : 1,
      imageUrl: data.url_imagem || undefined
    };
  }

  return null;
}

export async function dbDeleteBarProduct(productId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Soft-delete / Inativação: atualiza o campo status_ativo para 0 (inativo)
    const { error } = await supabase
      .from('produtos_bar')
      .update({
        status_ativo: 0,
        ativo: false,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error('Erro ao inativar produto do bar no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao inativar produto do bar:', err);
    return false;
  }
}

export async function dbGetBarComandas(): Promise<BarComanda[]> {
  if (!supabase) return [];
  try {
    // Try vendas_bar first, fallback to comandas_bar
    let cData: any = null;
    let cError: any = null;

    const resVendas = await supabase
      .from('vendas_bar')
      .select('*')
      .order('aberto_em', { ascending: false });

    if (!resVendas.error && resVendas.data) {
      cData = resVendas.data;
    } else {
      const resComandas = await supabase
        .from('comandas_bar')
        .select('*')
        .order('aberto_em', { ascending: false });
      cData = resComandas.data;
      cError = resComandas.error;
    }

    if (cError) {
      console.error('Erro ao buscar comandas/vendas do bar no Supabase:', cError);
      return [];
    }

    if (!cData || cData.length === 0) return [];

    // Try itens_vendas_bar first, fallback to itens_comanda_bar
    let iData: any[] = [];
    const resItensVendas = await supabase.from('itens_vendas_bar').select('*');
    if (!resItensVendas.error && resItensVendas.data) {
      iData = resItensVendas.data;
    } else {
      const resItensComanda = await supabase.from('itens_comanda_bar').select('*');
      if (resItensComanda.data) iData = resItensComanda.data;
    }

    const itemsMap: Record<string, BarComandaItem[]> = {};
    (iData || []).forEach(item => {
      const parentId = item.vendas_id || item.venda_id || item.comanda_id;
      if (!parentId) return;

      if (!itemsMap[parentId]) {
        itemsMap[parentId] = [];
      }
      itemsMap[parentId].push({
        id: item.id,
        productId: item.produto_id,
        productName: item.nome_produto,
        quantity: Number(item.quantidade) || 1,
        unitPrice: Number(item.preco_unitario) || 0,
        totalPrice: Number(item.preco_total) || 0,
        addedAt: item.adicionado_em || new Date().toISOString()
      });
    });

    return cData.map((c: any) => ({
      id: c.id,
      code: c.codigo,
      customerName: c.nome_cliente,
      customerPhone: c.telefone_cliente || '',
      location: c.localizacao || 'Balcão',
      status: c.status || 'Aberta',
      openedAt: c.aberto_em || c.criado_em,
      closedAt: c.fechado_em || undefined,
      date: c.data,
      items: itemsMap[c.id] || [],
      totalAmount: Number(c.valor_total) || 0,
      discount: Number(c.desconto) || 0,
      finalAmount: Number(c.valor_final) || 0,
      paymentMethod: c.forma_pagamento || undefined,
      notes: c.observacoes || undefined,
      origemVenda: c.origem_venda || 'comanda'
    }));
  } catch (err) {
    console.warn('Erro ao buscar comandas no Supabase:', err);
    return [];
  }
}

function formatTimestampForDb(dateStr?: string, timeOrIsoStr?: string): string {
  if (!timeOrIsoStr) return new Date().toISOString();
  const trimmed = timeOrIsoStr.trim();
  if (trimmed.includes('-') || trimmed.includes('T')) {
    return trimmed;
  }
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const validDate = dateStr && dateStr.includes('-') ? dateStr : new Date().toISOString().split('T')[0];
    const timeWithSeconds = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
    return `${validDate} ${timeWithSeconds}`;
  }
  return new Date().toISOString();
}

export async function dbSaveBarComanda(comanda: BarComanda): Promise<BarComanda | null> {
  if (!supabase) return null;

  const dbComanda: any = {
    id: comanda.id,
    codigo: comanda.code,
    nome_cliente: comanda.customerName,
    telefone_cliente: comanda.customerPhone || null,
    localizacao: comanda.location || 'Balcão',
    status: comanda.status,
    aberto_em: formatTimestampForDb(comanda.date, comanda.openedAt),
    fechado_em: comanda.closedAt ? formatTimestampForDb(comanda.date, comanda.closedAt) : null,
    data: comanda.date,
    valor_total: Number(comanda.totalAmount) || 0,
    desconto: Number(comanda.discount) || 0,
    valor_final: Number(comanda.finalAmount) || 0,
    forma_pagamento: comanda.paymentMethod || null,
    observacoes: comanda.notes || null,
    origem_venda: comanda.origemVenda || 'comanda'
  };

  // Try saving to vendas_bar first, fallback to comandas_bar
  let targetTable = 'vendas_bar';
  let { data: savedComanda, error: cErr } = await supabase
    .from('vendas_bar')
    .upsert(dbComanda)
    .select()
    .single();

  if (cErr) {
    targetTable = 'comandas_bar';
    const retry = await supabase
      .from('comandas_bar')
      .upsert(dbComanda)
      .select()
      .single();
    savedComanda = retry.data;
    cErr = retry.error;
  }

  if (cErr || !savedComanda) {
    console.error('Erro ao salvar comanda/venda no Supabase:', cErr);
    throw cErr;
  }

  const comandaId = savedComanda.id;
  const itemsTable = targetTable === 'vendas_bar' ? 'itens_vendas_bar' : 'itens_comanda_bar';

  try {
    // Try deleting old items
    const delRes = await supabase.from(itemsTable).delete().eq('vendas_id', comandaId);
    if (delRes.error) {
      await supabase.from(itemsTable).delete().eq('comanda_id', comandaId);
    }

    if (comanda.items && comanda.items.length > 0) {
      // Garantir que os produtos do consumo existam na tabela produtos_bar para não violar Foreign Key
      for (const item of comanda.items) {
        if (item.productId) {
          const { data: existingProd } = await supabase
            .from('produtos_bar')
            .select('id')
            .eq('id', item.productId)
            .maybeSingle();

          if (!existingProd) {
            await supabase.from('produtos_bar').upsert({
              id: item.productId,
              nome: item.productName || 'Produto',
              categoria: 'Geral',
              preco: Number(item.unitPrice) || 0,
              preco_custo: 0,
              estoque: 100,
              estoque_minimo: 5,
              unidade: 'un',
              ativo: true
            });
          }
        }
      }

      const dbItems = comanda.items.map(item => ({
        id: item.id || `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vendas_id: comandaId,
        comanda_id: comandaId,
        produto_id: item.productId,
        nome_produto: item.productName,
        quantidade: Number(item.quantity) || 1,
        preco_unitario: Number(item.unitPrice) || 0,
        preco_total: Number(item.totalPrice) || 0,
        adicionado_em: formatTimestampForDb(comanda.date, item.addedAt)
      }));

      // Try inserting with vendas_id first
      let { error: itemErr } = await supabase.from(itemsTable).insert(
        dbItems.map(({ comanda_id, ...rest }) => rest)
      );

      if (itemErr) {
        // Fallback to inserting with comanda_id
        const fallbackItems = dbItems.map(({ vendas_id, ...rest }) => rest);
        const { error: fallbackErr } = await supabase.from(itemsTable).insert(fallbackItems);
        if (fallbackErr) {
          console.error('Erro ao inserir itens:', fallbackErr);
        }
      }
    }
  } catch (iErr) {
    console.error('Erro ao salvar itens da comanda:', iErr);
  }

  return comanda;
}

export async function dbGetBarSales(): Promise<BarSale[]> {
  if (!supabase) return [];
  try {
    const { data: sData, error: sError } = await supabase
      .from('vendas_bar')
      .select('*')
      .order('criado_em', { ascending: false });

    if (sError) {
      console.error('Erro ao buscar vendas do bar:', sError);
      return [];
    }

    if (!sData || sData.length === 0) return [];

    let iData: any[] = [];
    const resItensVendas = await supabase.from('itens_vendas_bar').select('*');
    if (!resItensVendas.error && resItensVendas.data) {
      iData = resItensVendas.data;
    } else {
      const resItensVenda = await supabase.from('itens_venda_bar').select('*');
      if (resItensVenda.data) iData = resItensVenda.data;
    }

    const itemsMap: Record<string, BarSaleItem[]> = {};
    (iData || []).forEach(item => {
      const parentId = item.vendas_id || item.venda_id || item.comanda_id;
      if (!parentId) return;

      if (!itemsMap[parentId]) {
        itemsMap[parentId] = [];
      }
      itemsMap[parentId].push({
        productId: item.produto_id,
        productName: item.nome_produto,
        quantity: Number(item.quantidade) || 1,
        unitPrice: Number(item.preco_unitario) || 0,
        totalPrice: Number(item.preco_total) || 0,
        addedAt: item.adicionado_em || undefined
      });
    });

    return sData.map((s: any) => ({
      id: s.id,
      code: s.codigo,
      comandaId: s.comanda_id || undefined,
      customerName: s.nome_cliente || 'Cliente',
      customerPhone: s.telefone_cliente || undefined,
      location: s.localizacao || 'Balcão',
      items: itemsMap[s.id] || [],
      totalAmount: Number(s.valor_total) || 0,
      discount: Number(s.desconto) || 0,
      finalAmount: Number(s.valor_final) || 0,
      paymentMethod: s.forma_pagamento || 'Pix',
      paymentStatus: s.status_pagamento || 'Pago',
      status: s.status || 'Concluída',
      createdAt: s.criado_em || s.aberto_em,
      date: s.data,
      notes: s.observacoes || undefined,
      origemVenda: s.origem_venda || (s.comanda_id ? 'comanda' : 'balcão')
    }));
  } catch (err) {
    console.warn('Erro ao buscar vendas no Supabase:', err);
    return [];
  }
}

export async function dbSaveBarSale(sale: BarSale): Promise<BarSale | null> {
  if (!supabase) return null;

  const dbSale: any = {
    id: sale.id,
    codigo: sale.code,
    comanda_id: sale.comandaId || null,
    nome_cliente: sale.customerName || 'Cliente',
    telefone_cliente: sale.customerPhone || null,
    localizacao: sale.location || 'Balcão',
    valor_total: Number(sale.totalAmount) || 0,
    desconto: Number(sale.discount) || 0,
    valor_final: Number(sale.finalAmount) || 0,
    forma_pagamento: sale.paymentMethod || 'Pix',
    status_pagamento: sale.paymentStatus || 'Pago',
    status: sale.status || 'Concluída',
    criado_em: sale.createdAt,
    data: sale.date,
    observacoes: sale.notes || null,
    origem_venda: sale.origemVenda || (sale.comandaId ? 'comanda' : 'balcão')
  };

  const { data: savedSale, error: sErr } = await supabase
    .from('vendas_bar')
    .upsert(dbSale)
    .select()
    .single();

  if (sErr || !savedSale) {
    console.error('Erro ao salvar venda no Supabase:', sErr);
    throw sErr;
  }

  const saleId = savedSale.id;

  try {
    const del1 = await supabase.from('itens_vendas_bar').delete().eq('vendas_id', saleId);
    if (del1.error) {
      await supabase.from('itens_venda_bar').delete().eq('venda_id', saleId);
    }

    if (sale.items && sale.items.length > 0) {
      const dbItems = sale.items.map(item => ({
        vendas_id: saleId,
        venda_id: saleId,
        produto_id: item.productId,
        nome_produto: item.productName,
        quantidade: item.quantity,
        preco_unitario: Number(item.unitPrice) || 0,
        preco_total: Number(item.totalPrice) || 0,
        adicionado_em: sale.createdAt
      }));

      const ins1 = await supabase.from('itens_vendas_bar').insert(
        dbItems.map(({ venda_id, ...rest }) => rest)
      );

      if (ins1.error) {
        await supabase.from('itens_venda_bar').insert(
          dbItems.map(({ vendas_id, ...rest }) => rest)
        );
      }
    }
  } catch (iErr) {
    console.error('Erro ao salvar itens da venda:', iErr);
  }

  return sale;
}

export async function dbGetStockMovements(): Promise<StockMovement[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('movimentacoes_estoque')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error || !data) return [];

    return data.map(m => ({
      id: m.id,
      productId: m.produto_id,
      productName: m.nome_produto,
      type: m.tipo as any,
      quantity: Number(m.quantidade) || 0,
      unitCost: m.preco_custo_unitario !== undefined && m.preco_custo_unitario !== null ? Number(m.preco_custo_unitario) : undefined,
      totalCost: m.valor_total !== undefined && m.valor_total !== null ? Number(m.valor_total) : undefined,
      purchaseId: m.compra_id || undefined,
      reason: m.motivo,
      createdAt: m.criado_em,
      user: m.nome_usuario || m.usuario || 'Operador do Bar'
    }));
  } catch (err) {
    console.warn('Erro ao buscar movimentações de estoque no Supabase:', err);
    return [];
  }
}

export async function dbSaveStockMovement(movement: StockMovement): Promise<StockMovement | null> {
  if (!supabase) return null;

  const dbMovement: any = {
    id: movement.id,
    produto_id: movement.productId,
    nome_produto: movement.productName,
    tipo: movement.type,
    quantidade: Number(movement.quantity) || 0,
    preco_custo_unitario: movement.unitCost !== undefined ? Number(movement.unitCost) : null,
    valor_total: movement.totalCost !== undefined ? Number(movement.totalCost) : null,
    compra_id: movement.purchaseId || null,
    motivo: movement.reason,
    criado_em: movement.createdAt,
    nome_usuario: movement.user || 'Operador do Bar'
  };

  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .upsert(dbMovement)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar movimentação de estoque:', error);
    return null;
  }

  return {
    id: data.id,
    productId: data.produto_id,
    productName: data.nome_produto,
    type: data.tipo,
    quantity: Number(data.quantidade) || 0,
    unitCost: data.preco_custo_unitario !== undefined && data.preco_custo_unitario !== null ? Number(data.preco_custo_unitario) : undefined,
    totalCost: data.valor_total !== undefined && data.valor_total !== null ? Number(data.valor_total) : undefined,
    purchaseId: data.compra_id || undefined,
    reason: data.motivo,
    createdAt: data.criado_em,
    user: data.nome_usuario || 'Operador do Bar'
  };
}

// ====================================================================
// COMPRAS DO BAR & CUSTO MÉDIO PONDERADO (CMP)
// ====================================================================

export async function dbGetBarPurchases(): Promise<BarPurchase[]> {
  if (!supabase) return [];
  try {
    const { data: pData, error: pError } = await supabase
      .from('compras_bar')
      .select('*')
      .order('data_compra', { ascending: false });

    if (pError || !pData) return [];

    const { data: iData } = await supabase
      .from('itens_compras_bar')
      .select('*');

    const itemsMap: Record<string, BarPurchaseItem[]> = {};
    (iData || []).forEach((item: any) => {
      if (!item.compra_id) return;
      if (!itemsMap[item.compra_id]) itemsMap[item.compra_id] = [];
      itemsMap[item.compra_id].push({
        id: item.id,
        purchaseId: item.compra_id,
        productId: item.produto_id,
        productName: item.nome_produto,
        quantity: Number(item.quantidade) || 1,
        unit: item.unidade || 'un',
        costPrice: Number(item.custo_unitario) || 0,
        totalCost: Number(item.custo_total) || 0,
        previousCost: Number(item.custo_anterior) || 0,
        newAverageCost: Number(item.novo_custo_medio) || 0
      });
    });

    return pData.map((p: any) => ({
      id: p.id,
      code: p.codigo,
      supplier: p.fornecedor || undefined,
      invoiceNumber: p.numero_nota || undefined,
      purchaseDate: p.data_compra || new Date().toISOString().split('T')[0],
      totalAmount: Number(p.valor_total) || 0,
      paymentMethod: p.forma_pagamento || 'Pix',
      status: p.status || 'Concluída',
      notes: p.observacoes || undefined,
      user: p.usuario || 'Administrador',
      createdAt: p.criado_em,
      items: itemsMap[p.id] || []
    }));
  } catch (err) {
    console.warn('Erro ao carregar compras do bar do Supabase:', err);
    return [];
  }
}

export async function dbSaveBarPurchase(purchase: BarPurchase): Promise<{ savedPurchase: BarPurchase; updatedProducts: BarProduct[] } | null> {
  if (!supabase) return null;

  const dbPurchase: any = {
    id: purchase.id,
    codigo: purchase.code,
    fornecedor: purchase.supplier || null,
    numero_nota: purchase.invoiceNumber || null,
    data_compra: purchase.purchaseDate,
    valor_total: Number(purchase.totalAmount) || 0,
    forma_pagamento: purchase.paymentMethod || 'Pix',
    status: purchase.status || 'Concluída',
    observacoes: purchase.notes || null,
    usuario: purchase.user || 'Administrador',
    atualizado_em: new Date().toISOString()
  };

  const { data: savedData, error: pErr } = await supabase
    .from('compras_bar')
    .upsert(dbPurchase)
    .select()
    .single();

  if (pErr || !savedData) {
    console.error('Erro ao salvar compra no Supabase:', pErr);
    throw pErr;
  }

  const updatedProducts: BarProduct[] = [];
  const processedItems: BarPurchaseItem[] = [];

  // Limpar itens anteriores caso seja uma edição da compra
  await supabase.from('itens_compras_bar').delete().eq('compra_id', purchase.id);

  if (purchase.items && purchase.items.length > 0) {
    for (const item of purchase.items) {
      let currentStock = 0;
      let currentCost = 0;
      let currentTotalPurchased = 0;
      let prodName = item.productName;
      let prodCategory = 'Geral';
      let prodPrice = 0;
      let prodMinStock = 5;
      let prodUnit = item.unit || 'un';

      const { data: prodData } = await supabase
        .from('produtos_bar')
        .select('*')
        .eq('id', item.productId)
        .maybeSingle();

      if (prodData) {
        currentStock = Math.max(0, Number(prodData.estoque) || 0);
        currentCost = Math.max(0, Number(prodData.preco_custo) || 0);
        currentTotalPurchased = Number(prodData.total_comprado_acumulado) || 0;
        prodName = prodData.nome || item.productName;
        prodCategory = prodData.categoria || 'Geral';
        prodPrice = Number(prodData.preco) || 0;
        prodMinStock = Number(prodData.estoque_minimo) || 5;
        prodUnit = prodData.unidade || item.unit || 'un';
      }

      const purchaseQty = Number(item.quantity) || 1;
      const unitCostPaid = Number(item.costPrice) || 0;
      const newStock = currentStock + purchaseQty;

      // FÓRMULA DO CUSTO MÉDIO PONDERADO (CMP)
      let newAverageCost = unitCostPaid;
      if (currentStock > 0 && currentCost > 0) {
        newAverageCost = ((currentStock * currentCost) + (purchaseQty * unitCostPaid)) / (currentStock + purchaseQty);
      }
      newAverageCost = Math.round(newAverageCost * 100) / 100;
      const newTotalPurchased = currentTotalPurchased + purchaseQty;

      // Atualizar dados de estoque e custo médio no produto
      const updatedProdPayload: any = {
        id: item.productId,
        nome: prodName,
        categoria: prodCategory,
        preco: prodPrice,
        preco_custo: newAverageCost,
        ultimo_preco_compra: unitCostPaid,
        total_comprado_acumulado: newTotalPurchased,
        estoque: newStock,
        estoque_minimo: prodMinStock,
        unidade: prodUnit,
        ativo: true,
        status_ativo: 1,
        atualizado_em: new Date().toISOString()
      };

      const { data: savedProd } = await supabase
        .from('produtos_bar')
        .upsert(updatedProdPayload)
        .select()
        .single();

      if (savedProd) {
        updatedProducts.push({
          id: savedProd.id,
          name: savedProd.nome,
          category: savedProd.categoria,
          price: Number(savedProd.preco) || 0,
          costPrice: Number(savedProd.preco_custo) || 0,
          lastPurchasePrice: Number(savedProd.ultimo_preco_compra) || unitCostPaid,
          totalPurchasedQty: Number(savedProd.total_comprado_acumulado) || newTotalPurchased,
          stock: Number(savedProd.estoque) || 0,
          minStock: Number(savedProd.estoque_minimo) || 5,
          unit: savedProd.unidade || 'un',
          description: savedProd.descricao || undefined,
          active: savedProd.status_ativo !== 0 && savedProd.ativo !== false,
          status_ativo: Number(savedProd.status_ativo) || 1,
          imageUrl: savedProd.url_imagem || undefined
        });
      }

      // Inserir item da compra
      const itemId = item.id || `item-comp-${purchase.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const dbItemPayload = {
        id: itemId,
        compra_id: purchase.id,
        produto_id: item.productId,
        nome_produto: prodName,
        quantidade: purchaseQty,
        unidade: prodUnit,
        custo_unitario: unitCostPaid,
        custo_total: purchaseQty * unitCostPaid,
        custo_anterior: currentCost,
        novo_custo_medio: newAverageCost
      };

      await supabase.from('itens_compras_bar').insert(dbItemPayload);

      processedItems.push({
        ...item,
        id: itemId,
        purchaseId: purchase.id,
        productName: prodName,
        quantity: purchaseQty,
        unit: prodUnit,
        costPrice: unitCostPaid,
        totalCost: purchaseQty * unitCostPaid,
        previousCost: currentCost,
        newAverageCost: newAverageCost
      });

      // Registrar histórico de movimentação de estoque
      const movPayload = {
        id: `mov-comp-${purchase.id}-${item.productId}-${Date.now()}`,
        produto_id: item.productId,
        nome_produto: prodName,
        tipo: 'Entrada (Compra)',
        quantidade: purchaseQty,
        motivo: `Compra ${purchase.code} - Fornecedor: ${purchase.supplier || 'Geral'}`,
        preco_custo_unitario: unitCostPaid,
        valor_total: purchaseQty * unitCostPaid,
        compra_id: purchase.id,
        nome_usuario: purchase.user || 'Administrador',
        criado_em: new Date().toISOString()
      };

      await supabase.from('movimentacoes_estoque').insert(movPayload);
    }
  }

  return {
    savedPurchase: {
      ...purchase,
      items: processedItems
    },
    updatedProducts
  };
}

export async function dbDeleteBarPurchase(purchaseId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('compras_bar')
      .delete()
      .eq('id', purchaseId);

    if (error) {
      console.error('Erro ao deletar compra no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao deletar compra do bar:', err);
    return false;
  }
}

// ====================================================================
// SCRIPT SQL DDL COMPLETO DAS TABELAS DO SISTEMA
// ====================================================================

export const SQL_SCHEMA_SCRIPT = `-- ============================================================
-- SCRIPT DE CRIAÇÃO DAS TABELAS DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Arena Esportiva - Gestão de Agendamentos, Quadras, Jogadores, Torcedores, Perguntas e Avaliações
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

-- 11. TABELA DE JOGADORES (CADASTRO DE JOGADORES)
CREATE TABLE IF NOT EXISTS public.jogadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    esporte TEXT DEFAULT 'Geral',
    posicao TEXT,
    pago BOOLEAN DEFAULT FALSE,
    valor NUMERIC(10,2) DEFAULT 0.00,
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABELA DE TORCEDORES (CADASTRO DE TORCEDORES / VOTANTES)
CREATE TABLE IF NOT EXISTS public.torcedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    time_favorito TEXT,
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABELA DE TIMES (CADASTRO DE EQUIPES)
CREATE TABLE IF NOT EXISTS public.times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    esporte TEXT NOT NULL DEFAULT 'Beach Tennis',
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABELA DE MEMBROS DO TIME (PARTICIPANTES DO TIME)
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

-- 15. TABELA DE PERGUNTAS DE AVALIAÇÃO / CATEGORIAS DE PREMIAÇÃO
CREATE TABLE IF NOT EXISTS public.perguntas_avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    icone TEXT DEFAULT 'Crown',
    esporte TEXT DEFAULT 'Todos',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- INSERÇÃO DAS PERGUNTAS / CATEGORIAS PADRÃO DE AVALIAÇÃO
INSERT INTO public.perguntas_avaliacao (titulo, subtitulo, icone, esporte, ativo)
VALUES 
    ('Dono da Quadra (MVP)', 'Quem jogou demais, fez os melhores pontos e decidiu a partida?', 'Crown', 'Todos', true),
    ('Resenha Pura (O Mais Alegre)', 'Quem manteve a vibe lá em cima, fez piada e alegrou o jogo?', 'Smile', 'Todos', true),
    ('Sangue no Olho (Mais Esforçado)', 'Quem deu a vida em cada bola, correu na areia e não desistiu nunca?', 'Flame', 'Todos', true),
    ('Ponto de Placa (A Melhor Jogada)', 'Quem protagonizou a jogada mais bonita (peixinho, cortada ou defesa inacreditável)?', 'Zap', 'Todos', true)
ON CONFLICT DO NOTHING;

-- 16. TABELA DE AVALIAÇÕES / VOTOS DOS JOGADORES PÓS-JOGO (TABELA ANTIGA DE SUPORTE)
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

-- 17. TABELA DE AVALIAÇÃO DO JOGO (VÍNCULO COM AGENDAMENTO, JOGADOR OU TORCEDOR, TIPO E NOTA)
CREATE TABLE IF NOT EXISTS public.avaliacao_jogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    tipo_voter TEXT NOT NULL CHECK (tipo_voter IN ('jogador', 'torcedor')),
    jogador_id UUID REFERENCES public.jogadores(id) ON DELETE SET NULL,
    torcedor_id UUID REFERENCES public.torcedores(id) ON DELETE SET NULL,
    avaliador_nome TEXT,
    pergunta_id UUID REFERENCES public.perguntas_avaliacao(id) ON DELETE SET NULL,
    jogador_avaliado_nome TEXT,
    nota NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (nota >= 1.0 AND nota <= 5.0),
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 18. TABELA DE PRODUTOS DO BAR
CREATE TABLE IF NOT EXISTS public.produtos_bar (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT DEFAULT 'Bebidas',
    preco NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_custo NUMERIC(10,2) DEFAULT 0.00,
    estoque INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 5,
    unidade TEXT DEFAULT 'un',
    imagem TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 19. TABELA UNIFICADA DE VENDAS DO BAR (Comandas e Balcão/Venda Direta)
CREATE TABLE IF NOT EXISTS public.vendas_bar (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    comanda_id TEXT,
    nome_cliente TEXT,
    telefone_cliente TEXT,
    localizacao TEXT DEFAULT 'Balcão',
    origem_venda TEXT DEFAULT 'balcão' CHECK (origem_venda IN ('comanda', 'balcão')),
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10,2) DEFAULT 0.00,
    valor_final NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    forma_pagamento TEXT,
    status_pagamento TEXT DEFAULT 'Pago',
    status TEXT NOT NULL DEFAULT 'Aberta',
    aberto_em TIMESTAMPTZ,
    fechado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT
);

-- 20. TABELA DE ITENS DAS VENDAS DO BAR
CREATE TABLE IF NOT EXISTS public.itens_vendas_bar (
    id TEXT PRIMARY KEY,
    vendas_id TEXT NOT NULL REFERENCES public.vendas_bar(id) ON DELETE CASCADE,
    comanda_id TEXT,
    venda_id TEXT,
    produto_id TEXT REFERENCES public.produtos_bar(id) ON DELETE SET NULL,
    nome_produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    adicionado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 21. TABELA DE MOVIMENTAÇÕES DE ESTOQUE DO BAR
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id TEXT PRIMARY KEY,
    produto_id TEXT REFERENCES public.produtos_bar(id) ON DELETE CASCADE,
    nome_produto TEXT NOT NULL,
    tipo TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    usuario TEXT DEFAULT 'Operador do Bar'
);

-- ============================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_quadra ON public.agendamentos(quadra_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_agendamento ON public.jogadores(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_torcedores_agendamento ON public.torcedores(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_racha_agendamento ON public.jogadores_racha(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_membros_time_time ON public.membros_time(time_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_agendamento ON public.avaliacoes_jogadores(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_jogo_agendamento ON public.avaliacao_jogo(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_data ON public.vendas_bar(data);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_origem ON public.vendas_bar(origem_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_status ON public.vendas_bar(status);
CREATE INDEX IF NOT EXISTS idx_itens_vendas_bar_vendas_id ON public.itens_vendas_bar(vendas_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto ON public.movimentacoes_estoque(produto_id);
`;

// ====================================================================
// MÓDULO DO JOGADOR: JOGADORES, EQUIPES, VÍNCULOS E HISTÓRICO DE SORTEIOS
// ====================================================================

export async function dbGetJogadores(): Promise<Jogador[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('jogadores')
      .select('*')
      .order('nome_apelido', { ascending: true });

    if (error) throw error;

    return (data || []).map((j) => ({
      id: j.id,
      email: j.email,
      nomeApelido: j.nome_apelido,
      classificacaoGeral: Number(j.classificacao_geral) || 3.0,
      criadoEm: j.criado_em,
    }));
  } catch (err) {
    console.warn('Erro ao buscar jogadores do Supabase:', err);
    return [];
  }
}

export async function dbSaveJogador(jogador: Jogador): Promise<Jogador | null> {
  if (!supabase) return null;
  try {
    const dbPayload = {
      id: jogador.id,
      email: jogador.email.toLowerCase().trim(),
      nome_apelido: jogador.nomeApelido.trim(),
      classificacao_geral: jogador.classificacaoGeral,
    };

    const { data, error } = await supabase
      .from('jogadores')
      .upsert(dbPayload, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      nomeApelido: data.nome_apelido,
      classificacaoGeral: Number(data.classificacao_geral) || 3.0,
      criadoEm: data.criado_em,
    };
  } catch (err) {
    console.warn('Erro ao salvar jogador no Supabase:', err);
    return null;
  }
}

export async function dbGetEquipes(): Promise<EquipeJogador[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;

    return (data || []).map((e) => ({
      id: e.id,
      nome: e.nome,
      criadoPorJogadorId: e.criado_por_jogador_id,
      criadoEm: e.criado_em,
    }));
  } catch (err) {
    console.warn('Erro ao buscar equipes do Supabase:', err);
    return [];
  }
}

export async function dbSaveEquipe(equipe: EquipeJogador): Promise<EquipeJogador | null> {
  if (!supabase) return null;
  try {
    const dbPayload = {
      id: equipe.id,
      nome: equipe.nome.trim(),
      criado_por_jogador_id: equipe.criadoPorJogadorId || null,
    };

    const { data, error } = await supabase
      .from('equipes')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      nome: data.nome,
      criadoPorJogadorId: data.criado_por_jogador_id,
      criadoEm: data.criado_em,
    };
  } catch (err) {
    console.warn('Erro ao salvar equipe no Supabase:', err);
    return null;
  }
}

export async function dbGetEquipeMembros(equipeId?: string): Promise<EquipeMembro[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('equipe_membros').select(`
      equipe_id,
      jogador_id,
      classificacao_na_equipe,
      inserido_em,
      jogadores:jogador_id (
        id,
        email,
        nome_apelido
      )
    `);

    if (equipeId) {
      query = query.eq('equipe_id', equipeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      equipeId: row.equipe_id,
      jogadorId: row.jogador_id,
      classificacaoNaEquipe: Number(row.classificacao_na_equipe) || 3,
      inseridoEm: row.inserido_em,
      nomeApelido: row.jogadores?.nome_apelido,
      email: row.jogadores?.email,
    }));
  } catch (err) {
    console.warn('Erro ao buscar membros de equipes do Supabase:', err);
    return [];
  }
}

export async function dbSaveEquipeMembro(membro: EquipeMembro): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = {
      equipe_id: membro.equipeId,
      jogador_id: membro.jogadorId,
      classificacao_na_equipe: membro.classificacaoNaEquipe,
    };

    const { error } = await supabase
      .from('equipe_membros')
      .upsert(dbPayload, { onConflict: 'equipe_id,jogador_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Erro ao salvar membro de equipe no Supabase:', err);
    return false;
  }
}

export async function dbDeleteEquipeMembro(equipeId: string, jogadorId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('equipe_membros')
      .delete()
      .eq('equipe_id', equipeId)
      .eq('jogador_id', jogadorId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Erro ao remover membro da equipe no Supabase:', err);
    return false;
  }
}

export async function dbGetSorteiosHistorico(equipeId?: string): Promise<SorteioHistorico[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('sorteios_historico')
      .select(`
        id,
        equipe_id,
        realizado_por_jogador_id,
        realizado_por_nome,
        realizado_por_email,
        algoritmo_utilizado,
        quantidade_por_time,
        realizado_em,
        equipes:equipe_id ( nome ),
        sorteio_times_resultado (
          id,
          sorteio_id,
          identificador_time,
          jogador_id,
          jogador_nome,
          jogador_email,
          classificacao
        )
      `)
      .order('realizado_em', { ascending: false });

    if (equipeId) {
      query = query.eq('equipe_id', equipeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      equipeId: row.equipe_id,
      equipeNome: row.equipes?.nome,
      realizadoPorJogadorId: row.realizado_por_jogador_id,
      realizadoPorNome: row.realizado_por_nome,
      realizadoPorEmail: row.realizado_por_email,
      algoritmoUtilizado: row.algoritmo_utilizado as any,
      quantidadePorTime: Number(row.quantidade_por_time) || 2,
      realizadoEm: row.realizado_em,
      timesResultado: (row.sorteio_times_resultado || []).map((tr: any) => ({
        id: tr.id,
        sorteioId: tr.sorteio_id,
        identificadorTime: tr.identificador_time,
        jogadorId: tr.jogador_id,
        jogadorNome: tr.jogador_nome,
        jogadorEmail: tr.jogador_email,
        classificacao: Number(tr.classificacao) || 3,
      })),
    }));
  } catch (err) {
    console.warn('Erro ao buscar histórico de sorteios do Supabase:', err);
    return [];
  }
}

export async function dbSaveSorteioHistorico(sorteio: SorteioHistorico): Promise<boolean> {
  if (!supabase) return false;
  try {
    const sorteioPayload = {
      id: sorteio.id,
      equipe_id: sorteio.equipeId,
      realizado_por_jogador_id: sorteio.realizadoPorJogadorId || null,
      realizado_por_nome: sorteio.realizadoPorNome,
      realizado_por_email: sorteio.realizadoPorEmail || null,
      algoritmo_utilizado: sorteio.algoritmoUtilizado,
      quantidade_por_time: sorteio.quantidadePorTime,
      realizado_em: sorteio.realizadoEm,
    };

    const { error: sorteioError } = await supabase
      .from('sorteios_historico')
      .upsert(sorteioPayload);

    if (sorteioError) throw sorteioError;

    if (sorteio.timesResultado && sorteio.timesResultado.length > 0) {
      const timesPayload = sorteio.timesResultado.map((item, idx) => ({
        id: item.id || `str-${sorteio.id}-${idx}`,
        sorteio_id: sorteio.id,
        identificador_time: item.identificadorTime,
        jogador_id: item.jogadorId,
        jogador_nome: item.jogadorNome,
        jogador_email: item.jogadorEmail || null,
        classificacao: item.classificacao,
      }));

      const { error: itemsError } = await supabase
        .from('sorteio_times_resultado')
        .upsert(timesPayload);

      if (itemsError) throw itemsError;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao salvar sorteio e resultados no Supabase:', err);
    return false;
  }
}


