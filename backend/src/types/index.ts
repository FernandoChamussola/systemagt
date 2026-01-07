import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;        // ✅ AGORA OPCIONAL
  userId?: string;
  userRole?: 'USER' | 'ADMIN';
}

export interface JWTPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
}
