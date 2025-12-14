

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
  gts?: number[]; // Alterado para refletir a coluna ARRAY do banco
  cargo?: number;
  governanca?: boolean;
  avatar?: string; // Foto de perfil
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
  // Novos campos para Landing Page
  slogan?: string;
  descricao?: string;
  logo?: string;
  banner?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  cor_primaria?: string;
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

export interface MuralPost {
  id: number;
  gt_id: number;
  user_id: number; // ID numérico do usuário
  user_nome: string;
  conteudo: string;
  created_at: string;
  likes: number;
}
