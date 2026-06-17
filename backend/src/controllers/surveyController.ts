import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../types';
import {
  createSurveyModal,
  deleteSurveyModal,
  findPendingSurveyModal,
  listSurveyModals,
  readSurveyResponses,
  saveSurveyResponse,
  updateSurveyModal,
} from '../services/surveyStorage';

const prisma = new PrismaClient();

const modalSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().optional(),
  pergunta: z.string().min(1, 'Pergunta e obrigatoria'),
  opcoes: z.array(z.string().min(1)).min(2, 'Informe pelo menos duas opcoes'),
  ativo: z.boolean().optional(),
});

const modalUpdateSchema = modalSchema.partial().extend({
  opcoes: z.array(z.string().min(1)).min(2, 'Informe pelo menos duas opcoes').optional(),
});

const answerSchema = z.object({
  modalId: z.string().min(1),
  resposta: z.string().min(1),
});

export async function getPendingSurveyModal(req: AuthRequest, res: Response) {
  try {
    const modal = await findPendingSurveyModal(req.userId!);

    res.json({
      modal,
    });
  } catch (error) {
    console.error('Erro ao verificar pesquisa:', error);
    res.status(500).json({ error: 'Erro ao verificar pesquisa' });
  }
}

export async function submitSurveyResponse(req: AuthRequest, res: Response) {
  try {
    const { modalId, resposta } = answerSchema.parse(req.body);
    const modals = await listSurveyModals();
    const modal = modals.find((item) => item.id === modalId && item.ativo);

    if (!modal) {
      return res.status(404).json({ error: 'Modal nao encontrado ou inativo' });
    }

    if (!modal.opcoes.includes(resposta)) {
      return res.status(400).json({ error: 'Opcao invalida para este modal' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    const response = await saveSurveyResponse({
      id: randomUUID(),
      modalId: modal.id,
      modalTitulo: modal.titulo,
      userId: user.id,
      nome: user.nome,
      email: user.email,
      resposta,
      respondidoEm: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Resposta registrada com sucesso',
      response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('Erro ao registrar pesquisa:', error);
    res.status(500).json({ error: 'Erro ao registrar pesquisa' });
  }
}

export async function listSurveyResponses(req: AuthRequest, res: Response) {
  try {
    const modalId = typeof req.query.modalId === 'string' ? req.query.modalId : undefined;
    const responses = await readSurveyResponses(modalId);
    const total = responses.length;
    const byAnswer = responses.reduce<Record<string, number>>((acc, item) => {
      acc[item.resposta] = (acc[item.resposta] || 0) + 1;
      return acc;
    }, {});

    res.json({
      responses: responses.sort(
        (a, b) => new Date(b.respondidoEm).getTime() - new Date(a.respondidoEm).getTime()
      ),
      stats: {
        total,
        byAnswer,
      },
    });
  } catch (error) {
    console.error('Erro ao listar respostas da pesquisa:', error);
    res.status(500).json({ error: 'Erro ao listar respostas da pesquisa' });
  }
}

export async function listAdminSurveyModals(req: AuthRequest, res: Response) {
  try {
    const [modals, responses] = await Promise.all([
      listSurveyModals(),
      readSurveyResponses(),
    ]);

    res.json({
      modals: modals
        .map((modal) => ({
          ...modal,
          totalRespostas: responses.filter((item) => item.modalId === modal.id).length,
        }))
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),
    });
  } catch (error) {
    console.error('Erro ao listar modais:', error);
    res.status(500).json({ error: 'Erro ao listar modais' });
  }
}

export async function createAdminSurveyModal(req: AuthRequest, res: Response) {
  try {
    const data = modalSchema.parse(req.body);
    const opcoes = data.opcoes.map((opcao) => opcao.trim()).filter(Boolean);

    if (opcoes.length < 2) {
      return res.status(400).json({ error: 'Informe pelo menos duas opcoes' });
    }

    const modal = await createSurveyModal({
      ...data,
      opcoes,
    });

    res.status(201).json({ modal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('Erro ao criar modal:', error);
    res.status(500).json({ error: 'Erro ao criar modal' });
  }
}

export async function updateAdminSurveyModal(req: AuthRequest, res: Response) {
  try {
    const data = modalUpdateSchema.parse(req.body);
    const opcoes = data.opcoes?.map((opcao) => opcao.trim()).filter(Boolean);

    if (opcoes && opcoes.length < 2) {
      return res.status(400).json({ error: 'Informe pelo menos duas opcoes' });
    }

    const modal = await updateSurveyModal(req.params.modalId, {
      ...data,
      opcoes,
    });

    if (!modal) {
      return res.status(404).json({ error: 'Modal nao encontrado' });
    }

    res.json({ modal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('Erro ao atualizar modal:', error);
    res.status(500).json({ error: 'Erro ao atualizar modal' });
  }
}

export async function deleteAdminSurveyModal(req: AuthRequest, res: Response) {
  try {
    const deleted = await deleteSurveyModal(req.params.modalId);

    if (!deleted) {
      return res.status(404).json({ error: 'Modal nao encontrado' });
    }

    res.json({ message: 'Modal removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover modal:', error);
    res.status(500).json({ error: 'Erro ao remover modal' });
  }
}
