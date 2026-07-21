-- @sos-edit: false
-- ==========================================
-- INOVAP: SISTEMA DE GAMIFICAÇÃO AUTOMATIZADO
-- ==========================================

-- 1. GATILHO: SOMAR PONTOS AO USUÁRIO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    UPDATE users
    SET pontos = COALESCE(pontos, 0) + NEW.pontos_atribuidos
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_points ON pontuacao_logs;
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON pontuacao_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_points();


-- 2. GATILHO: CHECK-IN EM EVENTOS
CREATE OR REPLACE FUNCTION trigger_checkin_points()
RETURNS TRIGGER SECURITY DEFINER AS $$
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


-- 3. GATILHO: APROVAÇÃO DE ARTIGOS
CREATE OR REPLACE FUNCTION trigger_article_points()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    id_regra INT;
    valor_pontos INT;
    id_autor INT;
BEGIN
    IF NEW.aprovado = TRUE AND (OLD.aprovado IS NULL OR OLD.aprovado = FALSE) THEN
        SELECT id, valor INTO id_regra, valor_pontos FROM pontuacao_regras WHERE acao ILIKE '%artigo%' LIMIT 1;
        
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


-- 4. GATILHO: TAREFAS CONCLUÍDAS
CREATE OR REPLACE FUNCTION trigger_task_points()
RETURNS TRIGGER SECURITY DEFINER AS $$
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
