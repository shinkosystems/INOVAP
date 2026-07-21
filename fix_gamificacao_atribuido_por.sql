-- @sos-edit: false
-- ==========================================
-- INOVAP: CORREÇÃO DO CAMPO ATRIBUIDO_POR EM PONTUACAO_LOGS
-- ==========================================

-- 1. Remover a restrição de chave estrangeira que impede a conversão para TEXT
ALTER TABLE pontuacao_logs 
DROP CONSTRAINT IF EXISTS pontuacao_logs_atribuido_por_fkey;

-- 2. Alterar o tipo da coluna atribuido_por de UUID para TEXT
ALTER TABLE pontuacao_logs 
ALTER COLUMN atribuido_por TYPE TEXT USING atribuido_por::text;

-- 3. Atualizar gatilho de aprovação de artigos
CREATE OR REPLACE FUNCTION trigger_article_points()
RETURNS TRIGGER AS $$
DECLARE
    id_regra INT;
    valor_pontos INT;
    id_autor INT;
BEGIN
    IF NEW.aprovado = TRUE AND (OLD.aprovado IS NULL OR OLD.aprovado = FALSE) THEN
        -- Procura a regra de Artigos
        SELECT id, valor INTO id_regra, valor_pontos FROM pontuacao_regras WHERE acao ILIKE '%artigo%' LIMIT 1;
        
        -- Descobre o ID numérico do usuário baseado no UUID (campo 'autor' do artigo)
        SELECT id INTO id_autor FROM users WHERE uuid = NEW.autor;

        IF id_regra IS NOT NULL AND id_autor IS NOT NULL THEN
            INSERT INTO pontuacao_logs (user_id, regra_id, pontos_atribuidos, atribuido_por, motivo)
            VALUES (id_autor, id_regra, valor_pontos, 'Sistema', 'Artigo Validado: ' || NEW.titulo);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_article_approved ON artigos;
CREATE TRIGGER on_article_approved
AFTER UPDATE ON artigos
FOR EACH ROW
EXECUTE FUNCTION trigger_article_points();

-- 4. Atualizar gatilho de check-in em eventos
CREATE OR REPLACE FUNCTION trigger_checkin_points()
RETURNS TRIGGER AS $$
DECLARE
    id_regra INT;
    valor_pontos INT;
BEGIN
    IF NEW.status = 'checkin_realizado' AND (OLD.status IS NULL OR OLD.status != 'checkin_realizado') THEN
        SELECT id, valor INTO id_regra, valor_pontos FROM pontuacao_regras WHERE acao ILIKE '%check%' LIMIT 1;
        
        IF id_regra IS NOT NULL THEN
            INSERT INTO pontuacao_logs (user_id, regra_id, pontos_atribuidos, atribuido_por, motivo)
            VALUES (NEW.user_id, id_regra, valor_pontos, 'Sistema', 'Validação de Presença (Check-in)');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_checkin_event ON inscricoes;
CREATE TRIGGER on_checkin_event
AFTER UPDATE ON inscricoes
FOR EACH ROW
EXECUTE FUNCTION trigger_checkin_points();

-- 5. Atualizar gatilho de tarefas concluídas
CREATE OR REPLACE FUNCTION trigger_task_points()
RETURNS TRIGGER AS $$
DECLARE
    id_regra INT;
    valor_pontos INT;
BEGIN
    IF NEW.status = 'Concluído' AND (OLD.status IS NULL OR OLD.status != 'Concluído') THEN
        SELECT id, valor INTO id_regra, valor_pontos FROM pontuacao_regras WHERE acao ILIKE '%tarefa%' LIMIT 1;
        
        IF id_regra IS NOT NULL AND NEW.responsavel_id IS NOT NULL THEN
            INSERT INTO pontuacao_logs (user_id, regra_id, pontos_atribuidos, atribuido_por, motivo)
            VALUES (NEW.responsavel_id, id_regra, valor_pontos, 'Sistema', 'Tarefa Entregue: ' || NEW.titulo);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_task_completed ON tarefas;
CREATE TRIGGER on_task_completed
AFTER UPDATE ON tarefas
FOR EACH ROW
EXECUTE FUNCTION trigger_task_points();
