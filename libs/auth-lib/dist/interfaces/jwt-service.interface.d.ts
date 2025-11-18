import { JwtPayload } from './jwt-payload.interface';
export interface JwtServiceInterface {
    createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
    validateToken(token: string): Promise<JwtPayload>;
    decodeToken(token: string): JwtPayload | null;
}
//# sourceMappingURL=jwt-service.interface.d.ts.map