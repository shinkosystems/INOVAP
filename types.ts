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
  gts?: number[];
  cargo?: number;
  governanca?: boolean;
  avatar?: string;
  artigos: number;
  pontos: number;
  nivel?: string;
}

export interface Artigo {
  id: number;
  created_at: string;
  autor: string;
  conteudo: string;
  capa: string;
  aprovado: boolean;
  titulo: string;
  subtitulo: string;
  tags: string[];
}

export interface Empresa {
  id: number;
  responsavel: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  slogan?: string;
  descricao?: string;
  logo?: string;
  banner?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  cor_primaria?: string;
}

export interface PontuacaoRegra {
  id: number;
  acao: string;
  valor: number;
  icone?: string;
}

export interface PontuacaoLog {
  id: number;
  created_at: string;
  user_id: number;
  regra_id: number;
  pontos_atribuidos: number;
  atribuido_por: string;
  motivo?: string;
  user_nome?: string;
  regra_acao?: string;
}

export interface Evento {
  id: number;
  created_at?: string;
  criado_por?: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local: string;
  tipo: string;
  imagem_capa?: string;
  vagas?: number;
  exclusivo?: boolean;
}

export interface Inscricao {
  id: string;
  created_at: string;
  evento_id: number;
  user_id: number;
  status: 'confirmado' | 'checkin_realizado' | 'cancelado';
  checkin_at?: string;
  evento?: Evento;
  user?: User;
}