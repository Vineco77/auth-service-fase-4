"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLib = void 0;
const jwt_service_1 = require("./jwt-service");
class AuthLib {
    constructor(jwtSecret) {
        this.jwtService = new jwt_service_1.JwtService(jwtSecret);
    }
    async validateToken(token) {
        return await this.jwtService.validateToken(token);
    }
    decodeToken(token) {
        return this.jwtService.decodeToken(token);
    }
    // Método opcional para criar tokens (se outros serviços precisarem)
    async createToken(payload) {
        return await this.jwtService.createToken(payload);
    }
}
exports.AuthLib = AuthLib;
//# sourceMappingURL=auth-lib.js.map