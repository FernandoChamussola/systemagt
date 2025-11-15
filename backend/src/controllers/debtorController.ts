import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const debtorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(9, 'Telefone deve ter no mínimo 9 caracteres'),
  localizacao: z.string().optional(),
  descricao: z.string().optional(),
  outrosTelefones: z.string().optional(),
});

export async function createDebtor(req: AuthRequest, res: Response) {
  try {
    const data = debtorSchema.parse(req.body);

    const debtor = await prisma.debtor.create({
      data: {
        ...data,
        usuarioId: req.userId!,
      },
    });

    return res.status(201).json({ debtor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar devedor:', error);
    return res.status(500).json({ error: 'Erro ao criar devedor' });
  }
}

export async function listDebtors(req: AuthRequest, res: Response) {
  try {
    const debtors = await prisma.debtor.findMany({
      where: {
        usuarioId: req.userId!,
        ativo: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return res.json({ debtors });
  } catch (error) {
    console.error('Erro ao listar devedores:', error);
    return res.status(500).json({ error: 'Erro ao listar devedores' });
  }
}

export async function getDebtor(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const debtor = await prisma.debtor.findFirst({
      where: {
        id,
        usuarioId: req.userId!,
      },
    });

    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado' });
    }

    return res.json({ debtor });
  } catch (error) {
    console.error('Erro ao buscar devedor:', error);
    return res.status(500).json({ error: 'Erro ao buscar devedor' });
  }
}

export async function updateDebtor(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = debtorSchema.parse(req.body);

    const debtor = await prisma.debtor.findFirst({
      where: {
        id,
        usuarioId: req.userId!,
      },
    });

    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado' });
    }

    const updatedDebtor = await prisma.debtor.update({
      where: { id },
      data,
    });

    return res.json({ debtor: updatedDebtor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar devedor:', error);
    return res.status(500).json({ error: 'Erro ao atualizar devedor' });
  }
}

export async function deleteDebtor(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const debtor = await prisma.debtor.findFirst({
      where: {
        id,
        usuarioId: req.userId!,
      },
    });

    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado' });
    }

    await prisma.debtor.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({ message: 'Devedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover devedor:', error);
    return res.status(500).json({ error: 'Erro ao remover devedor' });
  }
}
