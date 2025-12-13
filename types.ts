export interface GT {
  id: number;
  gt: string;
}

export interface Cargo {
  id: number;
  cargo: string;
}

export interface User {
  id: number;
  created_at: string;
  last_login: string;
  nome: string;
  email: string;
  uuid: string;
  gt?: number;
  cargo?: number;
  governanca?: boolean;
  artigos: number;
  // Computed client-side for demo, or fetched if schema expands
  pontos?: number; 
  nivel?: string;
}

export interface Artigo {
  id: number;
  created_at: string;
  autor: string; // uuid
  conteudo: string;
  capa: string;
  aprovado: boolean;
  titulo: string;
  subtitulo: string;
  tags: string[];
}

export interface Empresa {
  id: number;
  responsavel: string; // uuid
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
}

export interface PontuacaoAcao {
  id: number;
  acao: string;
  pontuacao: number;
}

export interface Evento {
  id: number;
  titulo: string;
  data: string;
  local: string;
  tipo: string;
}