import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;        // ✅ AGORA OPCIONAL
  userId?: string;
}

export interface JWTPayload {
  userId: string;
}
