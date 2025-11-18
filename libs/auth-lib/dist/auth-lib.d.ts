import { JwtPayload } from './interfaces/jwt-payload.interface';
export declare class AuthLib {
    private jwtService;
    constructor(jwtSecret: string);
    validateToken(token: string): Promise<JwtPayload>;
    decodeToken(token: string): JwtPayload | null;
    createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
}
//# sourceMappingURL=auth-lib.d.ts.map