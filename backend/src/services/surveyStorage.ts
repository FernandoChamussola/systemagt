import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface SurveyModalRecord {
  id: string;
  titulo: string;
  descricao?: string;
  pergunta: string;
  opcoes: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface SurveyResponseRecord {
  id: string;
  modalId: string;
  modalTitulo: string;
  userId: string;
  nome: string;
  email: string;
  resposta: string;
  respondidoEm: string;
}

interface SurveyData {
  modals: SurveyModalRecord[];
  responses: SurveyResponseRecord[];
}

const dataDir = path.resolve(process.cwd(), 'data');
const surveyFile = path.join(dataDir, 'systemagt-survey.json');

function normalizeModal(item: any): SurveyModalRecord {
  const now = new Date().toISOString();
  const opcoes = Array.isArray(item?.opcoes)
    ? item.opcoes.filter((opcao: unknown) => typeof opcao === 'string' && opcao.trim())
    : [];

  return {
    id: typeof item?.id === 'string' ? item.id : randomUUID(),
    titulo: typeof item?.titulo === 'string' ? item.titulo : 'Modal',
    descricao: typeof item?.descricao === 'string' ? item.descricao : undefined,
    pergunta: typeof item?.pergunta === 'string' ? item.pergunta : 'Escolha uma opcao',
    opcoes: opcoes.length >= 2 ? opcoes : ['Sim', 'Nao'],
    ativo: typeof item?.ativo === 'boolean' ? item.ativo : true,
    criadoEm: typeof item?.criadoEm === 'string' ? item.criadoEm : now,
    atualizadoEm: typeof item?.atualizadoEm === 'string' ? item.atualizadoEm : now,
  };
}

function normalizeResponse(item: any): SurveyResponseRecord {
  return {
    id: typeof item?.id === 'string' ? item.id : randomUUID(),
    modalId: typeof item?.modalId === 'string' ? item.modalId : 'systemagt-feedback',
    modalTitulo: typeof item?.modalTitulo === 'string' ? item.modalTitulo : 'Pesquisa SystemAGT',
    userId: typeof item?.userId === 'string' ? item.userId : '',
    nome: typeof item?.nome === 'string' ? item.nome : '',
    email: typeof item?.email === 'string' ? item.email : '',
    resposta:
      item?.resposta === 'SIM'
        ? 'Sim'
        : item?.resposta === 'NAO'
          ? 'Nao'
          : typeof item?.resposta === 'string'
            ? item.resposta
            : '',
    respondidoEm:
      typeof item?.respondidoEm === 'string' ? item.respondidoEm : new Date().toISOString(),
  };
}

async function ensureSurveyFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(surveyFile);
  } catch {
    await fs.writeFile(surveyFile, JSON.stringify({ modals: [], responses: [] }, null, 2), 'utf-8');
  }
}

export async function readSurveyData(): Promise<SurveyData> {
  await ensureSurveyFile();

  const content = await fs.readFile(surveyFile, 'utf-8');
  if (!content.trim()) {
    return { modals: [], responses: [] };
  }

  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return {
      modals: [
        {
          id: 'systemagt-feedback',
          titulo: 'Pesquisa SystemAGT',
          descricao: 'Ajude-nos a melhorar a plataforma.',
          pergunta: 'Estas a gostar do SystemAGT?',
          opcoes: ['Sim', 'Nao'],
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        },
      ],
      responses: parsed
        .map(normalizeResponse)
        .filter((item: SurveyResponseRecord) => item.userId && item.resposta),
    };
  }

  return {
    modals: Array.isArray(parsed.modals) ? parsed.modals.map(normalizeModal) : [],
    responses: Array.isArray(parsed.responses)
      ? parsed.responses
          .map(normalizeResponse)
          .filter((item: SurveyResponseRecord) => item.userId && item.resposta)
      : [],
  };
}

async function writeSurveyData(data: SurveyData) {
  await ensureSurveyFile();
  await fs.writeFile(surveyFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function listSurveyModals() {
  const data = await readSurveyData();
  return data.modals;
}

export async function createSurveyModal(input: {
  titulo: string;
  descricao?: string;
  pergunta: string;
  opcoes: string[];
  ativo?: boolean;
}) {
  const data = await readSurveyData();
  const now = new Date().toISOString();
  const modal: SurveyModalRecord = {
    id: randomUUID(),
    titulo: input.titulo,
    descricao: input.descricao,
    pergunta: input.pergunta,
    opcoes: input.opcoes,
    ativo: input.ativo ?? true,
    criadoEm: now,
    atualizadoEm: now,
  };

  data.modals.push(modal);
  await writeSurveyData(data);
  return modal;
}

export async function updateSurveyModal(
  modalId: string,
  input: Partial<Pick<SurveyModalRecord, 'titulo' | 'descricao' | 'pergunta' | 'opcoes' | 'ativo'>>
) {
  const data = await readSurveyData();
  const modalIndex = data.modals.findIndex((item) => item.id === modalId);

  if (modalIndex < 0) {
    return null;
  }

  data.modals[modalIndex] = {
    ...data.modals[modalIndex],
    ...input,
    atualizadoEm: new Date().toISOString(),
  };

  await writeSurveyData(data);
  return data.modals[modalIndex];
}

export async function deleteSurveyModal(modalId: string) {
  const data = await readSurveyData();
  const initialLength = data.modals.length;

  data.modals = data.modals.filter((item) => item.id !== modalId);
  data.responses = data.responses.filter((item) => item.modalId !== modalId);

  if (data.modals.length === initialLength) {
    return false;
  }

  await writeSurveyData(data);
  return true;
}

export async function findPendingSurveyModal(userId: string) {
  const data = await readSurveyData();
  const answeredModalIds = new Set(
    data.responses.filter((item) => item.userId === userId).map((item) => item.modalId)
  );

  return (
    data.modals.find((modal) => modal.ativo && !answeredModalIds.has(modal.id)) || null
  );
}

export async function readSurveyResponses(modalId?: string): Promise<SurveyResponseRecord[]> {
  const data = await readSurveyData();
  return modalId
    ? data.responses.filter((item) => item.modalId === modalId)
    : data.responses;
}

export async function saveSurveyResponse(record: SurveyResponseRecord) {
  const data = await readSurveyData();
  const existingIndex = data.responses.findIndex(
    (item) => item.userId === record.userId && item.modalId === record.modalId
  );

  if (existingIndex >= 0) {
    data.responses[existingIndex] = record;
  } else {
    data.responses.push(record);
  }

  await writeSurveyData(data);
  return record;
}
