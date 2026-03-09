import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import fs from 'fs';
import path from 'path';
import { processImage, isImageFile, needsConversion } from '../utils/imageProcessor';

const prisma = new PrismaClient();
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

export async function uploadCollateral(req: AuthRequest, res: Response) {
  try {
    const { dividaId, descricao } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    if (!dividaId) {
      // Deletar arquivo se não tem dividaId
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'ID da dívida é obrigatório' });
    }

    // Verificar se a dívida pertence ao usuário
    const debt = await prisma.debt.findFirst({
      where: {
        id: dividaId,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      // Deletar arquivo se dívida não encontrada
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    // Processar imagem se necessário (converter HEIC/HEIF para JPEG)
    let finalFilename = file.filename;
    let finalOriginalName = file.originalname;
    let finalMimetype = file.mimetype;
    let finalSize = file.size;

    // Verificar mimetype ou extensão para detectar HEIC/HEIF
    const ext = file.originalname.toLowerCase().split('.').pop();
    const isHeic = ext === 'heic' || ext === 'heif';
    const mimetypeToCheck = isHeic ? 'image/heic' : file.mimetype;

    if (isImageFile(mimetypeToCheck) && needsConversion(mimetypeToCheck)) {
      try {
        const processed = await processImage(
          file.path,
          uploadDir,
          file.originalname,
          mimetypeToCheck
        );
        finalFilename = processed.filename;
        finalOriginalName = processed.originalName;
        finalMimetype = processed.mimetype;
        finalSize = processed.size;
      } catch (conversionError) {
        console.error('Erro ao converter imagem:', conversionError);
        // Se falhar a conversão, deletar arquivo e retornar erro
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          error: 'Erro ao processar imagem. Tente enviar em formato JPEG ou PNG.'
        });
      }
    }

    const collateral = await prisma.collateral.create({
      data: {
        dividaId,
        nomeArquivo: finalOriginalName,
        caminhoArquivo: finalFilename,
        tipoArquivo: finalMimetype,
        tamanho: finalSize,
        descricao,
      },
    });

    return res.status(201).json({ collateral });
  } catch (error) {
    // Deletar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erro ao fazer upload:', error);
    return res.status(500).json({ error: 'Erro ao fazer upload' });
  }
}

export async function listCollaterals(req: AuthRequest, res: Response) {
  try {
    const { dividaId } = req.query;

    if (!dividaId) {
      return res.status(400).json({ error: 'ID da dívida é obrigatório' });
    }

    // Verificar se a dívida pertence ao usuário
    const debt = await prisma.debt.findFirst({
      where: {
        id: dividaId as string,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const collaterals = await prisma.collateral.findMany({
      where: {
        dividaId: dividaId as string,
        ativo: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return res.json({ collaterals });
  } catch (error) {
    console.error('Erro ao listar garantias:', error);
    return res.status(500).json({ error: 'Erro ao listar garantias' });
  }
}

export async function getCollateral(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const collateral = await prisma.collateral.findFirst({
      where: {
        id,
        ativo: true,
        divida: {
          devedor: {
            usuarioId: req.userId!,
          },
        },
      },
    });

    if (!collateral) {
      return res.status(404).json({ error: 'Garantia não encontrada' });
    }

    return res.json({ collateral });
  } catch (error) {
    console.error('Erro ao buscar garantia:', error);
    return res.status(500).json({ error: 'Erro ao buscar garantia' });
  }
}

export async function downloadCollateral(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const collateral = await prisma.collateral.findFirst({
      where: {
        id,
        ativo: true,
        divida: {
          devedor: {
            usuarioId: req.userId!,
          },
        },
      },
    });

    if (!collateral) {
      return res.status(404).json({ error: 'Garantia não encontrada' });
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', collateral.caminhoArquivo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.download(filePath, collateral.nomeArquivo);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    return res.status(500).json({ error: 'Erro ao fazer download' });
  }
}

export async function deleteCollateral(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const collateral = await prisma.collateral.findFirst({
      where: {
        id,
        ativo: true,
        divida: {
          devedor: {
            usuarioId: req.userId!,
          },
        },
      },
    });

    if (!collateral) {
      return res.status(404).json({ error: 'Garantia não encontrada' });
    }

    // Soft delete
    await prisma.collateral.update({
      where: { id },
      data: { ativo: false },
    });

    // Opcional: deletar arquivo físico
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', collateral.caminhoArquivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ message: 'Garantia removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar garantia:', error);
    return res.status(500).json({ error: 'Erro ao deletar garantia' });
  }
}
