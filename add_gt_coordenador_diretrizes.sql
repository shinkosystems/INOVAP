-- Migration para adicionar coordenador, diretrizes e info institucional aos GTs
ALTER TABLE public.gts 
  ADD COLUMN IF NOT EXISTS coordenador_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diretrizes TEXT,
  ADD COLUMN IF NOT EXISTS info_institucional TEXT;

-- Índice para busca de coordenador
CREATE INDEX IF NOT EXISTS idx_gts_coordenador_id ON public.gts(coordenador_id);

-- Comentários para documentação
COMMENT ON COLUMN public.gts.coordenador_id IS 'FK para users - coordenador responsável pelo GT';
COMMENT ON COLUMN public.gts.diretrizes IS 'Diretrizes, mandato e escopo de atuação do GT';
COMMENT ON COLUMN public.gts.info_institucional IS 'Informações institucionais complementares (histórico, regulamento, etc)';