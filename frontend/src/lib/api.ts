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
  role?: 'USER' | 'ADMIN';
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

  requestPasswordReset: async (telefone: string): Promise<{
    message: string;
    codeSentTo: string;
  }> => {
    const response = await api.post('/auth/request-password-reset', { telefone });
    return response.data;
  },

  verifyResetCode: async (telefone: string, codigo: string): Promise<{
    message: string;
    resetToken: string;
  }> => {
    const response = await api.post('/auth/verify-reset-code', { telefone, codigo });
    return response.data;
  },

  resetPassword: async (resetToken: string, novaSenha: string): Promise<{
    message: string;
  }> => {
    const response = await api.post('/auth/reset-password', { resetToken, novaSenha });
    return response.data;
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


// Adicione estas funções NO FINAL do seu arquivo lib/api.ts existente

export const reportApi = {
  downloadDividas: async (params?: {
    devedorId?: string;
    status?: DebtStatus;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.devedorId) queryParams.append('devedorId', params.devedorId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dataInicio) queryParams.append('dataInicio', params.dataInicio.toISOString());
    if (params?.dataFim) queryParams.append('dataFim', params.dataFim.toISOString());

    const response = await api.get(`/reports/dividas?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadPagamentos: async (params?: {
    devedorId?: string;
    dividaId?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.devedorId) queryParams.append('devedorId', params.devedorId);
    if (params?.dividaId) queryParams.append('dividaId', params.dividaId);
    if (params?.dataInicio) queryParams.append('dataInicio', params.dataInicio.toISOString());
    if (params?.dataFim) queryParams.append('dataFim', params.dataFim.toISOString());

    const response = await api.get(`/reports/pagamentos?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadDevedores: async (): Promise<Blob> => {
    const response = await api.get('/reports/devedores', {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadCompleto: async (): Promise<Blob> => {
    const response = await api.get('/reports/completo', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Admin APIs
export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  criadoEm: string;
  _count?: {
    dividas: number;
    devedores: number;
  };
}

export interface AccessLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  success: boolean;
  errorMessage: string | null;
  criadoEm: string;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  debts: {
    total: number;
    totalLent: number;
    totalReceivable: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  notifications: {
    total: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  growth: Array<{ _count: number; criadoEm: string }>;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'all' | 'active' | 'inactive';
  }): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserDetails: async (userId: string): Promise<{
    user: AdminUser & {
      dividas: any[];
      devedores: any[];
    };
    stats: {
      totalDebts: number;
      totalLent: number;
      totalReceivable: number;
      overdue: number;
    };
  }> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  toggleUserStatus: async (userId: string, isActive: boolean): Promise<{
    message: string;
    user: AdminUser;
  }> => {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  resetUserPassword: async (userId: string, novaSenha: string): Promise<{
    message: string;
  }> => {
    const response = await api.post(`/admin/users/${userId}/reset-password`, { novaSenha });
    return response.data;
  },

  getDebts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Promise<{
    debts: any[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await api.get('/admin/debts', { params });
    return response.data;
  },

  getDebtors: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    debtors: any[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await api.get('/admin/debtors', { params });
    return response.data;
  },

  getAccessLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    success?: string;
    action?: string;
  }): Promise<{
    logs: AccessLog[];
    total: number;
    page: number;
    limit: number;
    stats: {
      todayTotal: number;
      todaySuccess: number;
      todayFailed: number;
    };
  }> => {
    const response = await api.get('/admin/access-logs', { params });
    return response.data;
  },
};

// System Notices API
export type SystemNoticePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface SystemNotice {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: SystemNoticePriority;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  lido?: boolean;
  lidoEm?: string | null;
  totalLeituras?: number;
  totalUsuarios?: number;
  percentualLeitura?: number;
}

// Cron API
export interface CronJob {
  nome: string;
  descricao: string;
  horarioAgendado: string;
  endpoint: string;
}

export interface NotificacaoRetry {
  id: string;
  devedor: string;
  usuario: string;
  tentativas: number;
  proximaTentativa: string | null;
  erro: string | null;
}

export interface NotificacaoFalha {
  id: string;
  devedor: string;
  usuario: string;
  tentativas: number;
  erro: string | null;
  atualizadoEm: string;
}

export interface CronStatus {
  crons: CronJob[];
  estatisticas: {
    notificacoesHoje: number;
    enviadasHoje: number;
    aguardandoRetry: number;
    falhasHoje: number;
    dividasComNotificacaoAuto: number;
  };
  notificacoesAguardandoRetry: NotificacaoRetry[];
  ultimasFalhas: NotificacaoFalha[];
}

export const cronApi = {
  getStatus: async (): Promise<CronStatus> => {
    const response = await api.get('/admin/crons/status');
    return response.data;
  },

  executarNotificacoes: async (): Promise<{
    message: string;
    executadoPor: string;
    iniciadoEm: string;
  }> => {
    const response = await api.post('/admin/crons/notificacoes');
    return response.data;
  },

  executarRetry: async (): Promise<{
    message: string;
    executadoPor: string;
    iniciadoEm: string;
  }> => {
    const response = await api.post('/admin/crons/retry');
    return response.data;
  },

  forcarRetry: async (notificationId: string): Promise<{
    message: string;
    notificationId: string;
  }> => {
    const response = await api.post(`/admin/crons/retry/${notificationId}`);
    return response.data;
  },

  limparFalhas: async (dias?: number): Promise<{
    message: string;
    diasAtras: number;
    removidas: number;
  }> => {
    const response = await api.delete('/admin/crons/falhas', {
      params: { dias },
    });
    return response.data;
  },
};

// Email API
export interface EmailStatus {
  configured: boolean;
  connected: boolean;
  message: string;
}

export interface EmailSendResult {
  message: string;
  total: number;
  enviados: number;
  falhas: number;
  detalhes?: Array<{
    userId: string;
    email: string;
    sucesso: boolean;
    erro?: string;
  }>;
}

export const emailApi = {
  getStatus: async (): Promise<EmailStatus> => {
    const response = await api.get('/admin/email/status');
    return response.data;
  },

  sendToUsers: async (data: {
    userIds: string[];
    assunto: string;
    mensagem: string;
  }): Promise<EmailSendResult> => {
    const response = await api.post('/admin/email/send', data);
    return response.data;
  },

  sendToAll: async (data: {
    assunto: string;
    mensagem: string;
  }): Promise<EmailSendResult> => {
    const response = await api.post('/admin/email/send-all', data);
    return response.data;
  },
};

export const systemNoticeApi = {
  // User endpoints
  list: async (): Promise<{ notices: SystemNotice[] }> => {
    const response = await api.get('/system-notices');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/system-notices/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/system-notices/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post('/system-notices/read-all');
    return response.data;
  },

  // Admin endpoints
  adminList: async (params?: {
    ativo?: boolean;
    prioridade?: SystemNoticePriority;
  }): Promise<{ notices: SystemNotice[] }> => {
    const response = await api.get('/admin/notices', { params });
    return response.data;
  },

  create: async (data: {
    titulo: string;
    conteudo: string;
    prioridade?: SystemNoticePriority;
  }): Promise<{ notice: SystemNotice }> => {
    const response = await api.post('/admin/notices', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      titulo?: string;
      conteudo?: string;
      prioridade?: SystemNoticePriority;
      ativo?: boolean;
    }
  ): Promise<{ notice: SystemNotice }> => {
    const response = await api.put(`/admin/notices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/notices/${id}`);
    return response.data;
  },
};

export default api;
