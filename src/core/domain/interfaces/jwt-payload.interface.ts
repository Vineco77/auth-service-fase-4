export interface JwtPayload {
  sub: string; 
  cpf: string;
  user_type: 'cliente' | 'funcionario';
  name?: string;
  iat?: number;
  exp?: number;
}