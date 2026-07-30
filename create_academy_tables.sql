-- ==========================================
-- INOVAP: CONFIGURAÇÕES E ARTIGOS DA ACADEMY
-- ==========================================

-- 1. Criar tabela configuracoes se não existir
CREATE TABLE IF NOT EXISTS public.configuracoes (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "Permitir leitura publica de configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Permitir tudo de configuracoes para public" ON public.configuracoes;

-- Criar políticas
CREATE POLICY "Permitir leitura publica de configuracoes" 
ON public.configuracoes FOR SELECT USING (true);

CREATE POLICY "Permitir tudo de configuracoes para public" 
ON public.configuracoes FOR ALL TO public USING (true) WITH CHECK (true);


-- 2. Criar ou Recriar tabela academy_videos
DROP TABLE IF EXISTS public.academy_videos CASCADE;

CREATE TABLE IF NOT EXISTS public.academy_videos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    conteudo TEXT,
    youtube_url TEXT NOT NULL,
    capa TEXT,
    autor UUID,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "Permitir select de academy_videos para public" ON public.academy_videos;
DROP POLICY IF EXISTS "Permitir tudo de academy_videos para public" ON public.academy_videos;

-- Criar políticas
CREATE POLICY "Permitir select de academy_videos para public" 
ON public.academy_videos FOR SELECT USING (true);

CREATE POLICY "Permitir tudo de academy_videos para public" 
ON public.academy_videos FOR ALL TO public USING (true) WITH CHECK (true);
