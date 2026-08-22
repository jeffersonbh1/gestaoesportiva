-- ====================================================================
-- BANCO DE DADOS: arena_fahel_beach
-- SGBD: PostgreSQL (Supabase)
-- Descrição: Esquema de tabelas em português para o sistema de agendamento 
--            e controle de racha/custos da Arena Fahel Beach.
-- ====================================================================

-- Habilitar extensão UUID para geração automática de identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TABELA: usuarios
-- Funcionalidade: Tela de Login, Controle de Usuários e Perfis de Acesso
-- ====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- Em produção, armazenar como hash (ex: bcrypt)
    nome VARCHAR(100) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('Administrador', 'Usuário')),
    email VARCHAR(100),
    telefone VARCHAR(20),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Tabela que armazena as credenciais de acesso e perfis dos administradores e funcionários.';
COMMENT ON COLUMN usuarios.perfil IS 'Perfil de permissão: Administrador (acesso total) ou Usuário (operador básico).';

-- ====================================================================
-- 2. TABELA: quadras
-- Funcionalidade: Configuração das Quadras, Preço e Status em Tempo Real
-- ====================================================================
CREATE TABLE IF NOT EXISTS quadras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Ocupada', 'Manutenção')),
    preco_por_hora NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quadras IS 'Armazena as quadras esportivas da Arena Fahel Beach, seus tipos, valores e status.';

-- ====================================================================
-- 3. TABELA: agendamentos
-- Funcionalidade: Status de Ocupação, Novo Agendamento e Histórico de Pagamentos
-- ====================================================================
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quadra_id UUID NOT NULL REFERENCES quadras(id) ON DELETE CASCADE,
    nome_cliente VARCHAR(100) NOT NULL,
    telefone_cliente VARCHAR(20) NOT NULL,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    esporte VARCHAR(50) NOT NULL,
    tipo_agendamento VARCHAR(50) DEFAULT 'Aluguel',
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status_pagamento IN ('Pago', 'Pendente', 'Reembolsado')),
    metodo_pagamento VARCHAR(30) NOT NULL CHECK (metodo_pagamento IN ('Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro')),
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restrição simples para evitar agendamentos sobrepostos na mesma quadra, no mesmo dia e horário
    CONSTRAINT sem_conflito_horario UNIQUE (quadra_id, data, horario_inicio)
);

-- Garantir coluna tipo_agendamento se a tabela já existir
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS tipo_agendamento VARCHAR(50) DEFAULT 'Aluguel';

-- ====================================================================
-- SCRIPT DE ALTERAÇÃO DA TABELA AGENDAMENTOS
-- Removendo colunas redundantes pois o vínculo de professor e alunos é armazenado na tabela aulas
-- ====================================================================
ALTER TABLE agendamentos DROP COLUMN IF EXISTS professor_id;
ALTER TABLE agendamentos DROP COLUMN IF EXISTS professor_nome;
ALTER TABLE agendamentos DROP COLUMN IF EXISTS aluno_id;
ALTER TABLE agendamentos DROP COLUMN IF EXISTS aluno_nome;

-- ====================================================================
-- 3B. TABELA: professores
-- Funcionalidade: Cadastro e Gestão de Professores/Instrutores
-- ====================================================================
CREATE TABLE IF NOT EXISTS professores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20) NOT NULL,
    esporte VARCHAR(50) NOT NULL,
    valor_hora NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE professores IS 'Tabela de cadastro e gestão dos professores e instrutores de esportes da arena.';

-- ====================================================================
-- 3C. TABELA: alunos
-- Funcionalidade: Cadastro e Gestão de Alunos Convocados/Matriculados
-- ====================================================================
CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20) NOT NULL,
    esporte VARCHAR(50) NOT NULL,
    nivel VARCHAR(30) DEFAULT 'Iniciante' CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
    professor_id UUID REFERENCES professores(id) ON DELETE SET NULL,
    professor_nome VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE alunos IS 'Tabela de cadastro e gestão dos alunos das aulas da arena.';

-- ====================================================================
-- 3D. TABELA: aulas
-- Funcionalidade: Associação de Aulas, Professores e Múltiplos Alunos por Agendamento
-- ====================================================================
CREATE TABLE IF NOT EXISTS aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES professores(id) ON DELETE SET NULL,
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE aulas IS 'Tabela de vínculo de aulas entre agendamento, professor e múltiplos alunos.';

-- ====================================================================
-- 3B. TABELA: esportes
-- Funcionalidade: Cadastro e Edição de Esportes
-- ====================================================================
CREATE TABLE IF NOT EXISTS esportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE esportes IS 'Tabela de cadastro e gestão dos esportes disponíveis na arena.';
ALTER TABLE esportes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- ====================================================================
-- 3C. TABELA: tipos_quadra
-- Funcionalidade: Cadastro e Edição de Tipos e Superfícies de Quadra
-- ====================================================================
CREATE TABLE IF NOT EXISTS tipos_quadra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tipos_quadra IS 'Tabela de cadastro e gestão dos tipos de quadra (ex: Areia, Saibro, Coberta, Poliesportiva).';
ALTER TABLE tipos_quadra ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- ====================================================================
-- 3E. TABELA: tipos_aluguel
-- Funcionalidade: Cadastro e Edição de Tipos de Aluguel / Agendamento
-- ====================================================================
CREATE TABLE IF NOT EXISTS tipos_aluguel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tipos_aluguel IS 'Tabela de cadastro e gestão dos tipos de aluguel/agendamento (ex: Aluguel, Aulas / Treino, Torneio / Evento).';

-- Tabela alternativa tipos_agendamento para compatibilidade
CREATE TABLE IF NOT EXISTS tipos_agendamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Desabilitar RLS (Row Level Security) para permitir leitura e gravação com a chave pública/anon
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE quadras DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores_racha DISABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE esportes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_quadra DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_aluguel DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_agendamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE professores DISABLE ROW LEVEL SECURITY;
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE aulas DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_quadra ON agendamentos(quadra_id);
CREATE INDEX IF NOT EXISTS idx_aulas_agendamento ON aulas(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_aulas_professor ON aulas(professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_aluno ON aulas(aluno_id);

COMMENT ON TABLE agendamentos IS 'Tabela principal de reservas das quadras, contendo dados do cliente contratante, horários, esporte e pagamento.';

-- ====================================================================
-- 4. TABELA: jogadores_racha
-- Funcionalidade: Racha & Divisão de Custos (Divisão de Jogo e Integração WhatsApp)
-- ====================================================================
CREATE TABLE IF NOT EXISTS jogadores_racha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    valor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jogadores_racha_agendamento ON jogadores_racha(agendamento_id);

COMMENT ON TABLE jogadores_racha IS 'Jogadores adicionados ao racha/divisão de um agendamento específico para divisão proporcional de custos.';


-- ====================================================================
-- DADOS INICIAIS (SEED DATA)
-- Baseado no mockData.ts configurado no sistema
-- ====================================================================

-- 1. Inserir Usuário Administrador de Testes (senha simulada para exemplo)
INSERT INTO usuarios (login, senha, nome, perfil, email, telefone)
VALUES 
('admin', 'admin123', 'Administrador Fahel', 'Administrador', 'contato@arenafahel.com.br', '(11) 97777-6666')
ON CONFLICT (login) DO NOTHING;

-- 2. Inserir Quadras Iniciais
-- Armazenando os IDs gerados para usar nas chaves estrangeiras
INSERT INTO quadras (id, nome, tipo, status, preco_por_hora, descricao)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Arena Areia 1 - Copacabana', 'Areia', 'Disponível', 90.00, 'Quadra de areia fina premium, ideal para vôlei de praia e futevôlei.'),
('00000000-0000-0000-0000-000000000002', 'Arena Areia 2 - Ipanema', 'Areia', 'Disponível', 90.00, 'Iluminação de LED de alta performance e sistema de drenagem avançado.'),
('00000000-0000-0000-0000-000000000003', 'Quadra Central - Coberta', 'Coberta', 'Disponível', 120.00, 'Piso de madeira amortecido e cobertura termoacústica.'),
('00000000-0000-0000-0000-000000000004', 'Quadra 4 - Poliesportiva', 'Poliesportiva', 'Disponível', 100.00, 'Quadra rápida multiuso perfeita para vôlei de quadra tradicional.')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Agendamentos Iniciais (Dia 07/07/2026 como base operacional)
INSERT INTO agendamentos (id, quadra_id, nome_cliente, telefone_cliente, data, horario_inicio, horario_fim, esporte, valor_total, status_pagamento, metodo_pagamento, observacoes)
VALUES 
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Rodrigo Silva', '(11) 98765-4321', '2026-07-07', '08:00', '09:30', 'Vôlei de Areia', 135.00, 'Pago', 'Pix', 'Mensalistas, trazer bola reserva.'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Mariana Costa', '(21) 99123-4567', '2026-07-07', '10:00', '11:00', 'Beach Tennis', 90.00, 'Pago', 'Cartão de Crédito', 'Aluguel de raquetes incluso.'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Lucas Oliveira', '(31) 99888-7766', '2026-07-07', '09:00', '11:00', 'Futevôlei', 180.00, 'Pendente', 'Pix', 'Solicitou rede regulada para futevôlei.'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Ana Julia Souza', '(11) 97777-1122', '2026-07-07', '18:00', '20:00', 'Vôlei de Quadra', 240.00, 'Pago', 'Pix', 'Grupo de vôlei do bairro.'),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Carlos Eduardo', '(19) 98111-2233', '2026-07-07', '14:00', '15:30', 'Vôlei de Quadra', 150.00, 'Pendente', 'Dinheiro', 'Vai pagar na recepção ao chegar.')
ON CONFLICT (id) DO NOTHING;

-- 4. Inserir Jogadores para Rachas Iniciais
INSERT INTO jogadores_racha (id, agendamento_id, nome, email, telefone, pago, valor)
VALUES 
('j0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Matheus Santos', 'matheus@gmail.com', '(11) 98222-3333', TRUE, 45.00),
('j0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Pedro Ramos', 'pedro@gmail.com', '(11) 98333-4444', TRUE, 45.00),
('j0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Thiago Pereira', 'thiago@gmail.com', '(31) 98888-1111', TRUE, 45.00),
('j0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Bruno Matos', 'bruno@gmail.com', '(31) 98888-2222', FALSE, 45.00),
('j0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Diego Souza', 'diego@gmail.com', '(31) 98888-3333', FALSE, 45.00)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 5. TABELA: avaliacoes_jogadores
-- Funcionalidade: Avaliação de Jogadores da Partida (MVP/Melhores Jogadores)
-- ====================================================================
CREATE TABLE IF NOT EXISTS avaliacoes_jogadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    avaliador_nome VARCHAR(100) NOT NULL,
    jogador_avaliado_nome VARCHAR(100) NOT NULL,
    nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unica_avaliacao UNIQUE (agendamento_id, avaliador_nome, jogador_avaliado_nome)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_agendamento ON avaliacoes_jogadores(agendamento_id);

COMMENT ON TABLE avaliacoes_jogadores IS 'Tabela que armazena os votos de avaliações entre jogadores de uma partida/racha.';
COMMENT ON COLUMN avaliacoes_jogadores.nota IS 'Nota de 1 a 5 estrelas atribuída de um jogador para o outro.';

-- Sementes iniciais para avaliações demonstrativas na partida de ID a0000000-0000-0000-0000-000000000001
INSERT INTO avaliacoes_jogadores (agendamento_id, avaliador_nome, jogador_avaliado_nome, nota)
VALUES
('a0000000-0000-0000-0000-000000000001', 'Matheus Santos', 'Pedro Ramos', 5),
('a0000000-0000-0000-0000-000000000001', 'Pedro Ramos', 'Matheus Santos', 4),
('a0000000-0000-0000-0000-000000000001', 'Rodrigo Silva', 'Matheus Santos', 5),
('a0000000-0000-0000-0000-000000000001', 'Rodrigo Silva', 'Pedro Ramos', 4)
ON CONFLICT (agendamento_id, avaliador_nome, jogador_avaliado_nome) DO NOTHING;

-- 6. Inserir Esportes Iniciais
INSERT INTO esportes (nome, descricao)
VALUES 
('Vôlei de Areia', 'Vôlei praticado em quadras de areia'),
('Futevôlei', 'Modalidade tradicional de futevôlei'),
('Beach Tennis', 'Tênis praticado na areia'),
('Vôlei de Quadra', 'Vôlei tradicional em quadra coberta ou poliesportiva')
ON CONFLICT (nome) DO NOTHING;

-- 7. Inserir Tipos de Quadra Iniciais
INSERT INTO tipos_quadra (nome, descricao)
VALUES 
('Areia', 'Quadra de areia fina'),
('Poliesportiva', 'Quadra rápida multiuso'),
('Saibro', 'Quadra com piso de saibro'),
('Coberta', 'Quadra com estrutura e cobertura termoacústica')
ON CONFLICT (nome) DO NOTHING;

-- ====================================================================
-- SCRIPT DE TRUNCATE E REPOPULAÇÃO COMPLETA DAS TABELAS DE CADASTRO
-- Execute este bloco diretamente no SQL Editor do Supabase
-- ====================================================================

-- 1. LIMPEZA COMPLETA DE TODAS AS TABELAS
TRUNCATE TABLE 
    avaliacoes_jogadores,
    jogadores_racha,
    aulas,
    agendamentos,
    alunos,
    professores,
    quadras,
    tipos_quadra,
    esportes,
    tipos_aluguel,
    tipos_agendamento,
    usuarios
RESTART IDENTITY CASCADE;

-- 2. REPOPULAÇÃO DAS TABELAS DE CADASTRO

-- A. Tipos de Quadra
INSERT INTO tipos_quadra (nome, descricao, ativo) VALUES
('Areia', 'Quadra de areia fina tratada para futevôlei, beach tennis e vôlei de praia', TRUE),
('Saibro', 'Quadra de terra e piso saibro para tênis e esportes de quadra aberta', TRUE),
('Coberta', 'Quadra coberta com estrutura termoacústica e amortecimento', TRUE),
('Poliesportiva', 'Quadra rápida multiuso para vôlei, basquete e futsal', TRUE),
('Sintética', 'Quadra com grama sintética de alta densidade', TRUE)
ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, ativo = EXCLUDED.ativo;

-- B. Esportes
INSERT INTO esportes (nome, descricao, ativo) VALUES
('Vôlei de Areia', 'Modalidade de vôlei de praia disputada na areia', TRUE),
('Futevôlei', 'Modalidade tradicional de futevôlei', TRUE),
('Beach Tennis', 'Prática de tênis em quadra de areia', TRUE),
('Vôlei de Quadra', 'Vôlei tradicional em quadra coberta ou poliesportiva', TRUE)
ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, ativo = EXCLUDED.ativo;

-- C. Tipos de Aluguel / Agendamento
INSERT INTO tipos_aluguel (nome, descricao, is_default) VALUES
('Aluguel', 'Reserva padrão por hora para jogos avulsos', TRUE),
('Aulas / Treino', 'Horário reservado para turmas e aulas de professores', FALSE),
('Torneio / Evento', 'Reserva para campeonatos, clínicas e eventos especiais', FALSE),
('Mensalista', 'Reserva recorrente contratada mensalmente', FALSE),
('Racha / Day Use', 'Uso coletivo com divisão de custos entre participantes', FALSE)
ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, is_default = EXCLUDED.is_default;

INSERT INTO tipos_agendamento (nome, descricao, is_default) VALUES
('Aluguel', 'Reserva padrão por hora para jogos avulsos', TRUE),
('Aulas / Treino', 'Horário reservado para turmas e aulas de professores', FALSE),
('Torneio / Evento', 'Reserva para campeonatos, clínicas e eventos especiais', FALSE),
('Mensalista', 'Reserva recorrente contratada mensalmente', FALSE),
('Racha / Day Use', 'Uso coletivo com divisão de custos entre participantes', FALSE)
ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, is_default = EXCLUDED.is_default;

-- D. Quadras
INSERT INTO quadras (id, nome, tipo, status, preco_por_hora, descricao) VALUES
('00000000-0000-0000-0000-000000000001', 'Arena Areia 1 - Copacabana', 'Areia', 'Disponível', 90.00, 'Quadra de areia fina premium, ideal para vôlei de praia e futevôlei.'),
('00000000-0000-0000-0000-000000000002', 'Arena Areia 2 - Ipanema', 'Areia', 'Disponível', 90.00, 'Iluminação de LED de alta performance e sistema de drenagem avançado.'),
('00000000-0000-0000-0000-000000000003', 'Quadra Central - Coberta', 'Coberta', 'Disponível', 120.00, 'Piso de madeira amortecido e cobertura termoacústica.'),
('00000000-0000-0000-0000-000000000004', 'Quadra 4 - Poliesportiva', 'Poliesportiva', 'Disponível', 100.00, 'Quadra rápida multiuso perfeita para vôlei de quadra tradicional.')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, tipo = EXCLUDED.tipo, preco_por_hora = EXCLUDED.preco_por_hora;

-- E. Usuários
INSERT INTO usuarios (login, senha, nome, perfil, email, telefone) VALUES
('admin', 'admin123', 'Administrador Fahel', 'Administrador', 'contato@arenafahel.com.br', '(11) 97777-6666')
ON CONFLICT (login) DO NOTHING;

-- F. Professores
INSERT INTO professores (id, nome, email, telefone, esporte, valor_hora, disponivel) VALUES
('f0000000-0000-0000-0000-000000000001', 'Professor Gabriel Costa', 'gabriel.costa@arena.com', '(11) 98888-1111', 'Beach Tennis', 80.00, TRUE),
('f0000000-0000-0000-0000-000000000002', 'Professora Fernanda Lima', 'fernanda.lima@arena.com', '(11) 98888-2222', 'Futevôlei', 85.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- G. Alunos
INSERT INTO alunos (id, nome, email, telefone, esporte, nivel, professor_id, professor_nome, status) VALUES
('s0000000-0000-0000-0000-000000000001', 'Lucas Mendes', 'lucas.mendes@email.com', '(11) 97777-3333', 'Beach Tennis', 'Intermediário', 'f0000000-0000-0000-0000-000000000001', 'Professor Gabriel Costa', 'Ativo'),
('s0000000-0000-0000-0000-000000000002', 'Beatriz Santos', 'beatriz.santos@email.com', '(11) 97777-4444', 'Beach Tennis', 'Iniciante', 'f0000000-0000-0000-0000-000000000001', 'Professor Gabriel Costa', 'Ativo'),
('s0000000-0000-0000-0000-000000000003', 'Rafael Oliveira', 'rafael.oliveira@email.com', '(11) 97777-5555', 'Futevôlei', 'Avançado', 'f0000000-0000-0000-0000-000000000002', 'Professora Fernanda Lima', 'Ativo')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 8. MÓDULO DO BAR: PRODUTOS, VENDAS, ITENS E ESTOQUE
-- ====================================================================

-- 8.1 Tabela de Produtos do Bar
CREATE TABLE IF NOT EXISTS produtos_bar (
    id TEXT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Geral',
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preco_custo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estoque NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estoque_minimo NUMERIC(10, 2) NOT NULL DEFAULT 5,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un',
    codigo_barras VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    status_ativo INTEGER NOT NULL DEFAULT 1, -- 1 = ativo, 0 = inativo (excluído)
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garantir coluna status_ativo para bases já existentes:
ALTER TABLE produtos_bar ADD COLUMN IF NOT EXISTS status_ativo INTEGER DEFAULT 1;
ALTER TABLE produtos_bar ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 8.2 Tabela de Vendas do Bar (Comandas Abertas, Fechadas e Vendas Balcão)
CREATE TABLE IF NOT EXISTS vendas_bar (
    id TEXT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    comanda_id TEXT,
    nome_cliente VARCHAR(150) NOT NULL DEFAULT 'Cliente',
    telefone_cliente VARCHAR(50),
    localizacao VARCHAR(100) DEFAULT 'Balcão',
    status VARCHAR(30) NOT NULL DEFAULT 'Aberta',
    origem_venda VARCHAR(20) NOT NULL DEFAULT 'comanda' CHECK (origem_venda IN ('comanda', 'balcão', 'balcao')),
    aberto_em TIMESTAMP WITH TIME ZONE,
    fechado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_final NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(50),
    status_pagamento VARCHAR(30) DEFAULT 'Pago',
    observacoes TEXT
);

-- 8.3 Tabela de Itens de Vendas do Bar
CREATE TABLE IF NOT EXISTS itens_vendas_bar (
    id TEXT PRIMARY KEY,
    vendas_id TEXT NOT NULL REFERENCES vendas_bar(id) ON DELETE CASCADE,
    produto_id TEXT REFERENCES produtos_bar(id) ON DELETE SET NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preco_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8.4 Tabela de Movimentações de Estoque do Bar
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id TEXT PRIMARY KEY,
    produto_id TEXT NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL,
    motivo TEXT,
    usuario VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Desabilitar RLS para acesso anon
ALTER TABLE produtos_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_vendas_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_itens_vendas_bar_vendas_id ON itens_vendas_bar(vendas_id);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_data ON vendas_bar(data);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_origem ON vendas_bar(origem_venda);

-- ====================================================================
-- SCRIPT DE MIGRAÇÃO DEFINITIVO E SEGURO (COMANDAS -> VENDAS & ORIGEM_VENDA)
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

-- 1. Garantir que a tabela vendas_bar exista
CREATE TABLE IF NOT EXISTS vendas_bar (
    id TEXT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    comanda_id TEXT,
    nome_cliente VARCHAR(150) NOT NULL DEFAULT 'Cliente',
    telefone_cliente VARCHAR(50),
    localizacao VARCHAR(100) DEFAULT 'Balcão',
    status VARCHAR(30) NOT NULL DEFAULT 'Aberta',
    origem_venda VARCHAR(20) DEFAULT 'comanda',
    aberto_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fechado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_final NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(50),
    status_pagamento VARCHAR(30) DEFAULT 'Pago',
    observacoes TEXT
);

-- 2. Adicionar quaisquer colunas faltantes e remover restrições NOT NULL indevidas em vendas_bar
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS aberto_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS fechado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS origem_venda VARCHAR(20) DEFAULT 'comanda';
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS comanda_id TEXT;
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(30) DEFAULT 'Pago';
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS localizacao VARCHAR(100) DEFAULT 'Balcão';
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS telefone_cliente VARCHAR(50);
ALTER TABLE vendas_bar ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Permitir valores nulos em colunas que podem não estar preenchidas (ex: comandas em aberto)
ALTER TABLE vendas_bar ALTER COLUMN forma_pagamento DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN status_pagamento DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN localizacao DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN telefone_cliente DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN comanda_id DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN fechado_em DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN aberto_em DROP NOT NULL;
ALTER TABLE vendas_bar ALTER COLUMN observacoes DROP NOT NULL;

-- 3. Garantir que a tabela itens_vendas_bar exista
CREATE TABLE IF NOT EXISTS itens_vendas_bar (
    id TEXT PRIMARY KEY,
    vendas_id TEXT NOT NULL REFERENCES vendas_bar(id) ON DELETE CASCADE,
    produto_id TEXT REFERENCES produtos_bar(id) ON DELETE SET NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preco_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Adicionar colunas faltantes em itens_vendas_bar se necessário
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS vendas_id TEXT;
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS produto_id TEXT;
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS nome_produto VARCHAR(150);
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS quantidade NUMERIC(10, 2) DEFAULT 1;
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS preco_unitario NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS preco_total NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE itens_vendas_bar ADD COLUMN IF NOT EXISTS adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 4.1 Garantir colunas em movimentacoes_estoque
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS usuario VARCHAR(100) DEFAULT 'Operador do Bar';
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS nome_usuario VARCHAR(100) DEFAULT 'Operador do Bar';

-- 5. Migrar dados da tabela antiga comandas_bar (se existir) para vendas_bar
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comandas_bar') THEN
        EXECUTE '
            INSERT INTO vendas_bar (id, codigo, nome_cliente, telefone_cliente, localizacao, status, origem_venda, aberto_em, fechado_em, data, valor_total, desconto, valor_final, forma_pagamento, observacoes)
            SELECT 
                id, 
                codigo, 
                nome_cliente, 
                telefone_cliente, 
                localizacao, 
                status, 
                ''comanda'',
                COALESCE(aberto_em, CURRENT_TIMESTAMP), 
                fechado_em, 
                data, 
                COALESCE(valor_total, 0.00), 
                COALESCE(desconto, 0.00), 
                COALESCE(valor_final, 0.00), 
                forma_pagamento, 
                observacoes
            FROM comandas_bar
            ON CONFLICT (id) DO UPDATE SET
                origem_venda = EXCLUDED.origem_venda,
                aberto_em = COALESCE(vendas_bar.aberto_em, EXCLUDED.aberto_em),
                fechado_em = COALESCE(vendas_bar.fechado_em, EXCLUDED.fechado_em);
        ';

        DROP TABLE comandas_bar CASCADE;
    END IF;
END $$;

-- 6. Migrar dados da tabela antiga itens_comanda_bar (se existir) para itens_vendas_bar
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itens_comanda_bar') THEN
        EXECUTE '
            INSERT INTO itens_vendas_bar (id, vendas_id, produto_id, nome_produto, quantidade, preco_unitario, preco_total, adicionado_em)
            SELECT 
                id, 
                comanda_id, 
                produto_id, 
                nome_produto, 
                COALESCE(quantidade, 1), 
                COALESCE(preco_unitario, 0.00), 
                COALESCE(preco_total, 0.00), 
                COALESCE(adicionado_em, CURRENT_TIMESTAMP)
            FROM itens_comanda_bar
            ON CONFLICT (id) DO NOTHING;
        ';

        DROP TABLE itens_comanda_bar CASCADE;
    END IF;
END $$;

-- 7. Migrar dados da tabela antiga itens_venda_bar (caso exista com esse nome no singular)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itens_venda_bar') THEN
        EXECUTE '
            INSERT INTO itens_vendas_bar (id, vendas_id, produto_id, nome_produto, quantidade, preco_unitario, preco_total, adicionado_em)
            SELECT 
                id, 
                venda_id, 
                produto_id, 
                nome_produto, 
                COALESCE(quantidade, 1), 
                COALESCE(preco_unitario, 0.00), 
                COALESCE(preco_total, 0.00), 
                COALESCE(adicionado_em, CURRENT_TIMESTAMP)
            FROM itens_venda_bar
            ON CONFLICT (id) DO NOTHING;
        ';

        DROP TABLE itens_venda_bar CASCADE;
    END IF;
END $$;

-- 8. Tratar a coluna origem_venda e garantir valores padrão
UPDATE vendas_bar 
SET origem_venda = CASE 
    WHEN comanda_id IS NOT NULL THEN 'comanda' 
    WHEN origem_venda IS NULL OR origem_venda = '' THEN 'comanda'
    ELSE origem_venda 
END;

-- 9. Aplicar restrição CHECK no campo origem_venda
ALTER TABLE vendas_bar DROP CONSTRAINT IF EXISTS check_origem_venda;
ALTER TABLE vendas_bar ADD CONSTRAINT check_origem_venda CHECK (origem_venda IN ('comanda', 'balcão', 'balcao'));

-- 10. Desabilitar RLS e criar índices de performance
ALTER TABLE produtos_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_vendas_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_itens_vendas_bar_vendas_id ON itens_vendas_bar(vendas_id);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_data ON vendas_bar(data);
CREATE INDEX IF NOT EXISTS idx_vendas_bar_origem ON vendas_bar(origem_venda);


-- ====================================================================
-- 9. MÓDULO DO JOGADOR: VÍNCULO DE EQUIPES E HISTÓRICO DE SORTEIOS
-- ====================================================================

-- 9.1 Extensões Recomendadas
CREATE EXTENSION IF NOT EXISTS "citext"; -- Para e-mails ignorarem maiúsculas/minúsculas

-- 9.2 Tipo Enum para Algoritmo de Sorteio
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_algoritmo') THEN
        CREATE TYPE tipo_algoritmo AS ENUM ('equilibrado', 'aleatorio');
    END IF;
END $$;

-- 9.3 Tabela: jogadores (Usuários Simplificados com Classificação 1 a 5 estrelas)
CREATE TABLE IF NOT EXISTS jogadores (
    id TEXT PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL, -- CITEXT impede duplicidade de e-mail
    nome_apelido VARCHAR(100) NOT NULL,
    classificacao_geral DECIMAL(3,2) DEFAULT 3.00, -- Armazena notas como 4.50 ou 5.00
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9.4 Tabela: equipes (Grupos criados por jogadores)
CREATE TABLE IF NOT EXISTS equipes (
    id TEXT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    criado_por_jogador_id TEXT REFERENCES jogadores(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9.5 Tabela de Vínculo: equipe_membros (Muitos-para-Muitos com Vínculo Automático por E-mail)
CREATE TABLE IF NOT EXISTS equipe_membros (
    equipe_id TEXT REFERENCES equipes(id) ON DELETE CASCADE,
    jogador_id TEXT REFERENCES jogadores(id) ON DELETE CASCADE,
    classificacao_na_equipe INT CHECK (classificacao_na_equipe BETWEEN 1 AND 5), -- Classificação individual no grupo
    inserido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (equipe_id, jogador_id)
);

-- 9.6 Tabela: sorteios_historico (Registro de Auditoria e Responsabilidade)
CREATE TABLE IF NOT EXISTS sorteios_historico (
    id TEXT PRIMARY KEY,
    equipe_id TEXT REFERENCES equipes(id) ON DELETE CASCADE,
    realizado_por_jogador_id TEXT REFERENCES jogadores(id) ON DELETE SET NULL,
    realizado_por_nome VARCHAR(100) NOT NULL,
    realizado_por_email VARCHAR(150),
    algoritmo_utilizado VARCHAR(30) NOT NULL DEFAULT 'equilibrado',
    quantidade_por_time INT NOT NULL DEFAULT 2,
    realizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9.7 Tabela: sorteio_times_resultado (Composição dos times de cada sorteio)
CREATE TABLE IF NOT EXISTS sorteio_times_resultado (
    id TEXT PRIMARY KEY,
    sorteio_id TEXT REFERENCES sorteios_historico(id) ON DELETE CASCADE,
    identificador_time VARCHAR(50) NOT NULL, -- Ex: 'Time A', 'Time B', 'Espera / Próximos'
    jogador_id TEXT REFERENCES jogadores(id) ON DELETE CASCADE,
    jogador_nome VARCHAR(100) NOT NULL,
    jogador_email VARCHAR(150),
    classificacao INT NOT NULL DEFAULT 3
);

-- Desabilitar RLS para permitir uso na aplicação
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros DISABLE ROW LEVEL SECURITY;
ALTER TABLE sorteios_historico DISABLE ROW LEVEL SECURITY;
ALTER TABLE sorteio_times_resultado DISABLE ROW LEVEL SECURITY;

-- 9.8 Índices de Performance
CREATE INDEX IF NOT EXISTS idx_jogadores_email ON jogadores(email);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_jogador ON equipe_membros(jogador_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_equipe ON equipe_membros(equipe_id);
CREATE INDEX IF NOT EXISTS idx_sorteios_equipe_data ON sorteios_historico(equipe_id, realizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_sorteio ON sorteio_times_resultado(sorteio_id);

-- ====================================================================
-- 10. MÓDULO DE COMPRAS DO BAR E CUSTO MÉDIO PONDERADO (CMP)
-- ====================================================================

-- 10.1 Adicionar colunas de suporte a custo médio em produtos_bar
ALTER TABLE produtos_bar ADD COLUMN IF NOT EXISTS ultimo_preco_compra NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE produtos_bar ADD COLUMN IF NOT EXISTS total_comprado_acumulado NUMERIC(10, 2) DEFAULT 0;

-- 10.2 Tabela de Compras / Notas de Entrada do Bar (compras_bar)
CREATE TABLE IF NOT EXISTS compras_bar (
    id TEXT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL, -- Ex: 'COMP-001'
    fornecedor VARCHAR(150),
    numero_nota VARCHAR(100),
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(50) DEFAULT 'Pix',
    status VARCHAR(30) NOT NULL DEFAULT 'Concluída', -- 'Concluída', 'Pendente', 'Cancelada'
    observacoes TEXT,
    usuario VARCHAR(100) DEFAULT 'Administrador',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10.3 Tabela de Itens da Compra (itens_compras_bar)
CREATE TABLE IF NOT EXISTS itens_compras_bar (
    id TEXT PRIMARY KEY,
    compra_id TEXT NOT NULL REFERENCES compras_bar(id) ON DELETE CASCADE,
    produto_id TEXT REFERENCES produtos_bar(id) ON DELETE SET NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un',
    custo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Preço unitário pago nesta compra
    custo_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,    -- quantidade * custo_unitario
    custo_anterior NUMERIC(10, 2) DEFAULT 0.00,          -- Custo médio antes desta entrada
    novo_custo_medio NUMERIC(10, 2) DEFAULT 0.00,        -- Custo médio após o recálculo ponderado
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10.4 Adicionar colunas de custo em movimentacoes_estoque
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS preco_custo_unitario NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS compra_id TEXT REFERENCES compras_bar(id) ON DELETE SET NULL;

-- 10.5 Desabilitar RLS para acesso anônimo/público
ALTER TABLE compras_bar DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_compras_bar DISABLE ROW LEVEL SECURITY;

-- 10.6 Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_compras_bar_data ON compras_bar(data_compra DESC);
CREATE INDEX IF NOT EXISTS idx_compras_bar_codigo ON compras_bar(codigo);
CREATE INDEX IF NOT EXISTS idx_itens_compras_compra_id ON itens_compras_bar(compra_id);
CREATE INDEX IF NOT EXISTS idx_itens_compras_produto_id ON itens_compras_bar(produto_id);




