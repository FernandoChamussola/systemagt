import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const prisma = new PrismaClient();

export async function generateToken(userId: string): Promise<string> {
  // Buscar role do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return jwt.sign(
    {
      userId,
      role: user?.role || 'USER'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
