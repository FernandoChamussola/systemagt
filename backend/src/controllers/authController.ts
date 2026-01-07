import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { enviarWhatsApp, formatarTelefone } from './notificationController';

const prisma = new PrismaClient();

const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  telefone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const requestResetSchema = z.object({
  telefone: z.string().min(9, 'Telefone invalido'),
});

const verifyCodeSchema = z.object({
  telefone: z.string().min(9, 'Telefone invalido'),
  codigo: z.string().length(6, 'Codigo deve ter 6 digitos'),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Token e obrigatorio'),
  novaSenha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export async function register(req: Request, res: Response) {
  try {
    const { nome, email, senha, telefone } = registerSchema.parse(req.body);

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Format phone before saving
    const telefoneFormatado = telefone ? formatarTelefone(telefone) : null;

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone: telefoneFormatado,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        criadoEm: true,
      },
    });

    const token = generateToken(user.id);

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se a conta está ativa
    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta desativada. Contacte o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = await generateToken(user.id);

    return res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        criadoEm: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

export async function logout(req: Request, res: Response) {
  return res.json({ message: 'Logout realizado com sucesso' });
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { telefone } = requestResetSchema.parse(req.body);

    // Format phone (adds 258 prefix if needed)
    const telefoneFormatado = formatarTelefone(telefone);

    // Find user by phone
    const user = await prisma.user.findFirst({
      where: {
        telefone: telefoneFormatado
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Nenhuma conta encontrada com este numero de telefone'
      });
    }

    if (!user.telefone) {
      return res.status(400).json({
        error: 'Esta conta nao possui telefone cadastrado'
      });
    }

    // Rate limiting: Check if user requested code recently (last 2 minutes)
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        criadoEm: {
          gte: new Date(Date.now() - 2 * 60 * 1000), // Last 2 minutes
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (recentToken) {
      const waitSeconds = Math.ceil((120000 - (Date.now() - recentToken.criadoEm.getTime())) / 1000);
      return res.status(429).json({
        error: `Aguarde ${waitSeconds} segundos antes de solicitar novo codigo`
      });
    }

    // Invalidate all previous tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usado: false,
      },
      data: {
        usado: true,
      },
    });

    // Generate 6-digit code
    const codigo = crypto.randomInt(100000, 999999).toString();

    // Create token with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        telefone: telefoneFormatado,
        codigo,
        expiraEm: expiresAt,
      },
    });

    // Send WhatsApp message
    const mensagem =
      `Ola ${user.nome},\n\n` +
      `Seu codigo de recuperacao de senha e:\n\n` +
      `*${codigo}*\n\n` +
      `Este codigo expira em 10 minutos.\n\n` +
      `Se voce nao solicitou esta recuperacao, ignore esta mensagem.\n\n` +
      `#DEBTTRACKER`;

    // Use system phone as origin (can be configured)
   // const origemTelefone = process.env.SYSTEM_PHONE || '258840000000';
    const resultado = await enviarWhatsApp(telefoneFormatado, telefoneFormatado, mensagem);

    if (!resultado.sucesso) {
      console.error('Erro ao enviar WhatsApp:', resultado.erro);
      return res.status(500).json({
        error: 'Erro ao enviar codigo via WhatsApp. Tente novamente.'
      });
    }

    // Mask phone for security (show only last 4 digits)
    const maskedPhone = telefoneFormatado.slice(0, -4) + '****';

    res.json({
      message: 'Codigo enviado com sucesso',
      codeSentTo: maskedPhone
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao solicitar recuperacao de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitacao' });
  }
}

export async function verifyResetCode(req: Request, res: Response) {
  try {
    const { telefone, codigo } = verifyCodeSchema.parse(req.body);

    const telefoneFormatado = formatarTelefone(telefone);

    // Find valid token
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        telefone: telefoneFormatado,
        codigo,
        usado: false,
        expiraEm: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!token) {
      return res.status(400).json({
        error: 'Codigo invalido ou expirado'
      });
    }

    // Check attempts (max 5 attempts)
    if (token.tentativas >= 5) {
      // Invalidate token after too many attempts
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usado: true },
      });

      return res.status(429).json({
        error: 'Muitas tentativas. Solicite um novo codigo.'
      });
    }

    // Increment attempts
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { tentativas: token.tentativas + 1 },
    });

    // Generate temporary reset token (JWT-like, valid for 15 minutes)
    const resetToken = jwt.sign(
      {
        tokenId: token.id,
        userId: token.userId,
        type: 'password-reset'
      },
      process.env.JWT_SECRET || 'fallback-secret-change-me',
      { expiresIn: '15m' }
    );

    res.json({
      message: 'Codigo verificado com sucesso',
      resetToken
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao verificar codigo:', error);
    res.status(500).json({ error: 'Erro ao verificar codigo' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { resetToken, novaSenha } = resetPasswordSchema.parse(req.body);

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || 'fallback-secret-change-me'
      );
    } catch (error) {
      return res.status(400).json({ error: 'Token invalido ou expirado' });
    }

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ error: 'Token invalido' });
    }

    // Verify token still exists and not used
    const passwordToken = await prisma.passwordResetToken.findUnique({
      where: {
        id: decoded.tokenId,
      },
    });

    if (!passwordToken || passwordToken.usado) {
      return res.status(400).json({ error: 'Token invalido ou ja utilizado' });
    }

    if (passwordToken.expiraEm < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    // Hash new password
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { senha: senhaHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: passwordToken.id },
      data: { usado: true },
    });

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
}
