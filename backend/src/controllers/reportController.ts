import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Função auxiliar para formatar data
function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 0,
  }).format(valor);
}

// Função auxiliar para adicionar cabeçalho ao PDF
function adicionarCabecalho(doc: PDFKit.PDFDocument, titulo: string, nomeUsuario: string) {
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(titulo, { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Gerado por: ${nomeUsuario}`, { align: 'center' })
    .text(`Data: ${formatarData(new Date())}`, { align: 'center' })
    .moveDown(1);

  // Linha separadora
  doc
    .strokeColor('#333333')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(1);
}

// Função auxiliar para adicionar rodapé ao PDF
function adicionarRodape(doc: PDFKit.PDFDocument) {
  const bottom = doc.page.height - 50;

  doc
    .fontSize(8)
    .font('Helvetica')
    .text(
      'Sistema de Gestão de Devedores - Gerado automaticamente',
      50,
      bottom,
      { align: 'center', width: 500 }
    );
}

// RELATÓRIO 1: Relatório de Dívidas
export async function gerarRelatorioDividas(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { devedorId, status, dataInicio, dataFim } = req.query;

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Construir filtros
    const where: any = {
      usuarioId: userId,
      ativo: true,
    };

    if (devedorId) where.devedorId = devedorId as string;
    if (status) where.status = status;
    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio as string);
      if (dataFim) where.criadoEm.lte = new Date(dataFim as string);
    }

    // Buscar dívidas
    const dividas = await prisma.debt.findMany({
      where,
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar resposta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-dividas-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Adicionar cabeçalho
    adicionarCabecalho(doc, 'RELATÓRIO DE DÍVIDAS', usuario.nome);

    // Estatísticas gerais
    const totalDividas = dividas.length;
    const totalValorInicial = dividas.reduce((sum, d) => sum + d.valorInicial, 0);
    const totalPago = dividas.reduce(
      (sum, d) => sum + d.pagamentos.reduce((s, p) => s + p.valor, 0),
      0
    );
    const totalComJuros = dividas.reduce(
      (sum, d) => sum + d.valorInicial + (d.valorInicial * d.taxaJuros) / 100,
      0
    );
    const totalRestante = totalComJuros - totalPago;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Resumo Geral', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total de dívidas: ${totalDividas}`)
      .text(`Valor inicial total: ${formatarMoeda(totalValorInicial)}`)
      .text(`Valor com juros: ${formatarMoeda(totalComJuros)}`)
      .text(`Total pago: ${formatarMoeda(totalPago)}`)
      .text(`Total restante: ${formatarMoeda(totalRestante)}`)
      .moveDown(1);

    // Listar dívidas
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Detalhes das Dívidas', { underline: true })
      .moveDown(0.5);

    for (const divida of dividas) {
      const valorComJuros = divida.valorInicial + (divida.valorInicial * divida.taxaJuros) / 100;
      const totalPagoDivida = divida.pagamentos.reduce((sum, p) => sum + p.valor, 0);
      const valorRestante = valorComJuros - totalPagoDivida;

      // Verificar se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
        adicionarCabecalho(doc, 'RELATÓRIO DE DÍVIDAS (continuação)', usuario.nome);
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a73e8')
        .text(`Devedor: ${divida.devedor.nome}`, { continued: false })
        .fillColor('#000000');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Telefone: ${divida.devedor.telefone}`)
        .text(`Valor inicial: ${formatarMoeda(divida.valorInicial)}`)
        .text(`Taxa de juros: ${divida.taxaJuros}%`)
        .text(`Valor com juros: ${formatarMoeda(valorComJuros)}`)
        .text(`Total pago: ${formatarMoeda(totalPagoDivida)}`)
        .text(`Valor restante: ${formatarMoeda(valorRestante)}`)
        .text(`Status: ${divida.status}`)
        .text(`Data de vencimento: ${formatarData(divida.dataVencimento)}`)
        .text(`Data de criação: ${formatarData(divida.criadoEm)}`)
        .moveDown(0.3);

      // Linha separadora
      doc
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);
    }

    if (dividas.length === 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Nenhuma dívida encontrada com os filtros selecionados.', { align: 'center' });
    }

    // Adicionar rodapé
    adicionarRodape(doc);

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de dívidas:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

// RELATÓRIO 2: Relatório de Pagamentos
export async function gerarRelatorioPagamentos(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { devedorId, dividaId, dataInicio, dataFim } = req.query;

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Construir filtros
    const where: any = {
      ativo: true,
      divida: {
        usuarioId: userId,
      },
    };

    if (dividaId) where.dividaId = dividaId as string;
    if (devedorId) {
      where.divida = {
        ...where.divida,
        devedorId: devedorId as string,
      };
    }
    if (dataInicio || dataFim) {
      where.dataPagamento = {};
      if (dataInicio) where.dataPagamento.gte = new Date(dataInicio as string);
      if (dataFim) where.dataPagamento.lte = new Date(dataFim as string);
    }

    // Buscar pagamentos
    const pagamentos = await prisma.payment.findMany({
      where,
      include: {
        divida: {
          include: {
            devedor: true,
          },
        },
      },
      orderBy: {
        dataPagamento: 'desc',
      },
    });

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar resposta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-pagamentos-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Adicionar cabeçalho
    adicionarCabecalho(doc, 'RELATÓRIO DE PAGAMENTOS', usuario.nome);

    // Estatísticas gerais
    const totalPagamentos = pagamentos.length;
    const totalValor = pagamentos.reduce((sum, p) => sum + p.valor, 0);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Resumo Geral', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total de pagamentos: ${totalPagamentos}`)
      .text(`Valor total recebido: ${formatarMoeda(totalValor)}`)
      .moveDown(1);

    // Listar pagamentos
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Detalhes dos Pagamentos', { underline: true })
      .moveDown(0.5);

    for (const pagamento of pagamentos) {
      // Verificar se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
        adicionarCabecalho(doc, 'RELATÓRIO DE PAGAMENTOS (continuação)', usuario.nome);
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#10b981')
        .text(`Pagamento de ${formatarMoeda(pagamento.valor)}`, { continued: false })
        .fillColor('#000000');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Devedor: ${pagamento.divida.devedor.nome}`)
        .text(`Telefone: ${pagamento.divida.devedor.telefone}`)
        .text(`Data do pagamento: ${formatarData(pagamento.dataPagamento)}`)
        .text(`Descrição: ${pagamento.descricao || 'N/A'}`)
        .moveDown(0.3);

      // Linha separadora
      doc
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);
    }

    if (pagamentos.length === 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Nenhum pagamento encontrado com os filtros selecionados.', { align: 'center' });
    }

    // Adicionar rodapé
    adicionarRodape(doc);

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de pagamentos:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

// RELATÓRIO 3: Relatório de Devedores
export async function gerarRelatorioDevedores(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar devedores com estatísticas
    const devedores = await prisma.debtor.findMany({
      where: {
        usuarioId: userId,
        ativo: true,
      },
      include: {
        dividas: {
          where: { ativo: true },
          include: {
            pagamentos: {
              where: { ativo: true },
            },
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar resposta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-devedores-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Adicionar cabeçalho
    adicionarCabecalho(doc, 'RELATÓRIO DE DEVEDORES', usuario.nome);

    // Estatísticas gerais
    const totalDevedores = devedores.length;
    const devedoresComDividas = devedores.filter(d => d.dividas.length > 0).length;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Resumo Geral', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total de devedores: ${totalDevedores}`)
      .text(`Devedores com dívidas ativas: ${devedoresComDividas}`)
      .moveDown(1);

    // Listar devedores
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Detalhes dos Devedores', { underline: true })
      .moveDown(0.5);

    for (const devedor of devedores) {
      // Calcular estatísticas do devedor
      const totalDividas = devedor.dividas.length;
      const totalValorDevido = devedor.dividas.reduce((sum, d) => {
        const valorComJuros = d.valorInicial + (d.valorInicial * d.taxaJuros) / 100;
        const totalPago = d.pagamentos.reduce((s, p) => s + p.valor, 0);
        return sum + (valorComJuros - totalPago);
      }, 0);

      // Verificar se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
        adicionarCabecalho(doc, 'RELATÓRIO DE DEVEDORES (continuação)', usuario.nome);
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#ef4444')
        .text(`${devedor.nome}`, { continued: false })
        .fillColor('#000000');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Telefone: ${devedor.telefone}`)
        .text(`Localização: ${devedor.localizacao || 'N/A'}`)
        .text(`Total de dívidas: ${totalDividas}`)
        .text(`Valor total devido: ${formatarMoeda(totalValorDevido)}`)
        .text(`Cadastrado em: ${formatarData(devedor.criadoEm)}`)
        .moveDown(0.3);

      // Linha separadora
      doc
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);
    }

    if (devedores.length === 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Nenhum devedor cadastrado.', { align: 'center' });
    }

    // Adicionar rodapé
    adicionarRodape(doc);

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de devedores:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

// RELATÓRIO 4: Relatório Completo (Resumo Executivo)
export async function gerarRelatorioCompleto(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar dados para o resumo
    const devedores = await prisma.debtor.count({
      where: { usuarioId: userId, ativo: true },
    });

    const dividas = await prisma.debt.findMany({
      where: { usuarioId: userId, ativo: true },
      include: {
        pagamentos: { where: { ativo: true } },
      },
    });

    const pagamentos = await prisma.payment.findMany({
      where: {
        ativo: true,
        divida: {
          usuarioId: userId,
        },
      },
    });

    // Estatísticas
    const totalDividas = dividas.length;
    const dividasPendentes = dividas.filter(d => d.status === 'PENDENTE').length;
    const dividasAtrasadas = dividas.filter(d => d.status === 'ATRASADO').length;
    const dividasPagas = dividas.filter(d => d.status === 'PAGO').length;

    const totalValorEmprestado = dividas.reduce((sum, d) => sum + d.valorInicial, 0);
    const totalComJuros = dividas.reduce(
      (sum, d) => sum + d.valorInicial + (d.valorInicial * d.taxaJuros) / 100,
      0
    );
    const totalRecebido = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const totalPendente = totalComJuros - totalRecebido;

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar resposta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-completo-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Adicionar cabeçalho
    adicionarCabecalho(doc, 'RELATÓRIO EXECUTIVO COMPLETO', usuario.nome);

    // Seção 1: Visão Geral
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a73e8')
      .text('1. VISÃO GERAL', { underline: true })
      .fillColor('#000000')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total de devedores cadastrados: ${devedores}`)
      .text(`Total de dívidas: ${totalDividas}`)
      .text(`Total de pagamentos registrados: ${pagamentos.length}`)
      .moveDown(1);

    // Seção 2: Status das Dívidas
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a73e8')
      .text('2. STATUS DAS DÍVIDAS', { underline: true })
      .fillColor('#000000')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Dívidas pendentes: ${dividasPendentes}`)
      .text(`Dívidas atrasadas: ${dividasAtrasadas}`)
      .text(`Dívidas pagas: ${dividasPagas}`)
      .moveDown(1);

    // Seção 3: Resumo Financeiro
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a73e8')
      .text('3. RESUMO FINANCEIRO', { underline: true })
      .fillColor('#000000')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total emprestado (valor inicial): ${formatarMoeda(totalValorEmprestado)}`)
      .text(`Total a receber (com juros): ${formatarMoeda(totalComJuros)}`)
      .text(`Total recebido: ${formatarMoeda(totalRecebido)}`)
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#10b981')
      .text(`Total pendente: ${formatarMoeda(totalPendente)}`)
      .fillColor('#000000')
      .moveDown(1);

    // Seção 4: Top 5 Maiores Devedores
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a73e8')
      .text('4. TOP 5 MAIORES DEVEDORES', { underline: true })
      .fillColor('#000000')
      .moveDown(0.5);

    const devedoresComValor = await prisma.debtor.findMany({
      where: { usuarioId: userId, ativo: true },
      include: {
        dividas: {
          where: { ativo: true },
          include: {
            pagamentos: { where: { ativo: true } },
          },
        },
      },
    });

    const devedoresComTotal = devedoresComValor
      .map(devedor => {
        const totalDevido = devedor.dividas.reduce((sum, d) => {
          const valorComJuros = d.valorInicial + (d.valorInicial * d.taxaJuros) / 100;
          const totalPago = d.pagamentos.reduce((s, p) => s + p.valor, 0);
          return sum + (valorComJuros - totalPago);
        }, 0);
        return { ...devedor, totalDevido };
      })
      .filter(d => d.totalDevido > 0)
      .sort((a, b) => b.totalDevido - a.totalDevido)
      .slice(0, 5);

    if (devedoresComTotal.length > 0) {
      devedoresComTotal.forEach((devedor, index) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `${index + 1}. ${devedor.nome} - ${formatarMoeda(devedor.totalDevido)} (${devedor.dividas.length} ${devedor.dividas.length === 1 ? 'dívida' : 'dívidas'})`
          );
      });
    } else {
      doc.fontSize(10).font('Helvetica').text('Nenhum devedor com dívidas pendentes.');
    }

    // Adicionar rodapé
    adicionarRodape(doc);

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório completo:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}
