"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class JwtService {
    constructor(secret) {
        this.expiresIn = '15m';
        if (!secret) {
            throw new Error('JWT_SECRET is required');
        }
        this.secret = secret;
    }
    async createToken(payload) {
        try {
            const options = {
                expiresIn: this.expiresIn,
                issuer: 'auth-service',
            };
            return jwt.sign(payload, this.secret, options);
        }
        catch (error) {
            throw new Error(`Failed to create JWT token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret);
            return decoded;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw new Error(`Token validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    decodeToken(token) {
        try {
            return jwt.decode(token);
        }
        catch {
            return null;
        }
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=jwt-service.js.map