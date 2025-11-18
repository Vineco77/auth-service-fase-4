import { JwtPayload } from './interfaces/jwt-payload.interface';
export declare class JwtService {
    secret: string;
    private readonly expiresIn;
    constructor(secret: string);
    createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
    validateToken(token: string): Promise<JwtPayload>;
    decodeToken(token: string): JwtPayload | null;
}
//# sourceMappingURL=jwt-service.d.ts.map