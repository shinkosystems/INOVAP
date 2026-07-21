-- Script de migração para adicionar a coluna de descrição aos GTs
ALTER TABLE public.gts ADD COLUMN IF NOT EXISTS descricao TEXT;
