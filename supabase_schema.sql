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
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Areia', 'Poliesportiva', 'Saibro', 'Coberta')),
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
    esporte VARCHAR(40) NOT NULL CHECK (esporte IN ('Vôlei de Areia', 'Futevôlei', 'Vôlei de Quadra', 'Beach Tennis')),
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status_pagamento IN ('Pago', 'Pendente', 'Reembolsado')),
    metodo_pagamento VARCHAR(30) NOT NULL CHECK (metodo_pagamento IN ('Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro')),
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restrição simples para evitar agendamentos sobrepostos na mesma quadra, no mesmo dia e horário
    CONSTRAINT sem_conflito_horario UNIQUE (quadra_id, data, horario_inicio)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_quadra ON agendamentos(quadra_id);

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

