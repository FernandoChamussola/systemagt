import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Debtor {
  id: string;
  usuarioId: string;
  nome: string;
  telefone: string;
  localizacao?: string;
  descricao?: string;
  outrosTelefones?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export const authApi = {
  register: async (data: { nome: string; email: string; senha: string; telefone?: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; senha: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  me: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export const debtorApi = {
  create: async (data: {
    nome: string;
    telefone: string;
    localizacao?: string;
    descricao?: string;
    outrosTelefones?: string;
  }): Promise<{ debtor: Debtor }> => {
    const response = await api.post('/debtors', data);
    return response.data;
  },

  list: async (): Promise<{ debtors: Debtor[] }> => {
    const response = await api.get('/debtors');
    return response.data;
  },

  get: async (id: string): Promise<{ debtor: Debtor }> => {
    const response = await api.get(`/debtors/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      nome: string;
      telefone: string;
      localizacao?: string;
      descricao?: string;
      outrosTelefones?: string;
    }
  ): Promise<{ debtor: Debtor }> => {
    const response = await api.put(`/debtors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/debtors/${id}`);
    return response.data;
  },
};

export type DebtStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export interface Payment {
  id: string;
  dividaId: string;
  valor: number;
  dataPagamento: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Collateral {
  id: string;
  dividaId: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tipoArquivo: string;
  tamanho: number;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Debt {
  id: string;
  devedorId: string;
  valorInicial: number;
  valorAtual: number;
  taxaJuros: number;
  dataEmprestimo: string;
  dataVencimento: string;
  status: DebtStatus;
  notificacaoAuto: boolean;
  periodicidadeNotificacao?: number;
  ultimaNotificacao?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  devedor?: Debtor;
  pagamentos?: Payment[];
  garantias?: Collateral[];
}

export const debtApi = {
  create: async (data: {
    devedorId: string;
    valorInicial: number;
    taxaJuros: number;
    dataVencimento: string;
    notificacaoAuto?: boolean;
    periodicidadeNotificacao?: number;
  }): Promise<{ debt: Debt }> => {
    const response = await api.post('/debts', data);
    return response.data;
  },

  list: async (params?: { status?: DebtStatus; devedorId?: string }): Promise<{ debts: Debt[] }> => {
    const response = await api.get('/debts', { params });
    return response.data;
  },

  get: async (id: string): Promise<{ debt: Debt }> => {
    const response = await api.get(`/debts/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      devedorId: string;
      valorInicial: number;
      taxaJuros: number;
      dataVencimento: string;
      notificacaoAuto?: boolean;
      periodicidadeNotificacao?: number;
    }
  ): Promise<{ debt: Debt }> => {
    const response = await api.put(`/debts/${id}`, data);
    return response.data;
  },

  increaseInterest: async (id: string, novoJuros: number): Promise<{ debt: Debt }> => {
    const response = await api.patch(`/debts/${id}/increase-interest`, { novoJuros });
    return response.data;
  },

  markAsPaid: async (id: string): Promise<{ debt: Debt }> => {
    const response = await api.patch(`/debts/${id}/mark-paid`);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/debts/${id}`);
    return response.data;
  },
};

export const paymentApi = {
  create: async (data: {
    dividaId: string;
    valor: number;
    dataPagamento?: string;
    descricao?: string;
  }): Promise<{ payment: Payment }> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  list: async (dividaId: string): Promise<{ payments: Payment[] }> => {
    const response = await api.get('/payments', { params: { dividaId } });
    return response.data;
  },

  get: async (id: string): Promise<{ payment: Payment }> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },
};

export interface DashboardStats {
  resumo: {
    totalDevedores: number;
    totalEmprestado: number;
    totalAReceber: number;
    valorEmAtraso: number;
    dividasAtivas: number;
  };
  dividasProximasVencimento: Array<{
    id: string;
    devedorNome: string;
    devedorTelefone: string;
    valorInicial: number;
    valorTotal: number;
    valorRestante: number;
    dataVencimento: string;
    diasParaVencer: number;
    status: DebtStatus;
  }>;
  dividasAtrasadas: Array<{
    id: string;
    devedorNome: string;
    devedorTelefone: string;
    valorInicial: number;
    valorTotal: number;
    valorRestante: number;
    dataVencimento: string;
    diasAtrasado: number;
    status: DebtStatus;
  }>;
  estatisticasPorStatus: {
    pendentes: number;
    atrasadas: number;
    pagas: number;
  };
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export type NotificationStatus = 'PENDENTE' | 'ENVIADO' | 'FALHOU';

export interface Notification {
  id: string;
  usuarioId: string;
  devedorId?: string;
  dividaId?: string;
  telefone: string;
  mensagem: string;
  status: NotificationStatus;
  erroMensagem?: string;
  enviadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
  devedor?: Debtor;
  divida?: Debt;
}

export const notificationApi = {
  list: async (params?: {
    devedorId?: string;
    dividaId?: string;
    status?: NotificationStatus;
  }): Promise<{ notifications: Notification[] }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  sendManual: async (
    debtId: string,
    mensagemPersonalizada?: string
  ): Promise<{
    message: string;
    notification: Notification;
    sucesso: boolean;
  }> => {
    const response = await api.post(`/notifications/send-manual/${debtId}`, {
      mensagemPersonalizada,
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const collateralApi = {
  upload: async (dividaId: string, file: File, descricao?: string): Promise<{ collateral: Collateral }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dividaId', dividaId);
    if (descricao) {
      formData.append('descricao', descricao);
    }

    const response = await api.post('/collaterals', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  list: async (dividaId: string): Promise<{ collaterals: Collateral[] }> => {
    const response = await api.get('/collaterals', { params: { dividaId } });
    return response.data;
  },

  get: async (id: string): Promise<{ collateral: Collateral }> => {
    const response = await api.get(`/collaterals/${id}`);
    return response.data;
  },

  getUrl: (caminhoArquivo: string): string => {
    return `/uploads/${caminhoArquivo}`;
  },

  download: async (id: string): Promise<void> => {
    const response = await api.get(`/collaterals/${id}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'download';

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/collaterals/${id}`);
    return response.data;
  },
};

export default api;
