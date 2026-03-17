import nodemailer from 'nodemailer';

// Configuração do transporter Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'debttracker6@gmail.com', // Email do remetente (deve ser um Gmail)
    pass: process.env.EMAIL_APP_PASSWORD || 'jdoa kqis zunx yswe', // App Password do Gmail
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface EmailResult {
  sucesso: boolean;
  messageId?: string;
  erro?: string;
}

/**
 * Envia um email usando Gmail SMTP
 */
export async function enviarEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('Configurações de email não definidas');
      return {
        sucesso: false,
        erro: 'Configurações de email não definidas no servidor',
      };
    }

    const mailOptions = {
      from: `"DebtTracker" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email enviado para ${options.to}: ${info.messageId}`);

    return {
      sucesso: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido ao enviar email',
    };
  }
}

/**
 * Envia email com código de recuperação de senha
 */
export async function enviarCodigoRecuperacao(
  email: string,
  nome: string,
  codigo: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">DebtTracker</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Olá ${nome},</h2>

        <p style="color: #666; font-size: 16px;">
          Você solicitou a recuperação de senha da sua conta.
        </p>

        <p style="color: #666; font-size: 16px;">
          Seu código de verificação é:
        </p>

        <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${codigo}
        </div>

        <p style="color: #999; font-size: 14px;">
          Este código expira em <strong>10 minutos</strong>.
        </p>

        <p style="color: #999; font-size: 14px;">
          Se você não solicitou esta recuperação, ignore este email.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
          Este é um email automático. Não responda a esta mensagem.
        </p>
      </div>
    </div>
  `;

  const text = `
Olá ${nome},

Você solicitou a recuperação de senha da sua conta.

Seu código de verificação é: ${codigo}

Este código expira em 10 minutos.

Se você não solicitou esta recuperação, ignore este email.

--
DebtTracker
  `.trim();

  return enviarEmail({
    to: email,
    subject: 'Código de Recuperação de Senha - DebtTracker',
    text,
    html,
  });
}

/**
 * Envia email de mensagem do admin para usuário
 */
export async function enviarMensagemAdmin(
  email: string,
  nomeUsuario: string,
  assunto: string,
  mensagem: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">DebtTracker</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Olá ${nomeUsuario},</h2>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
          <p style="color: #333; font-size: 16px; white-space: pre-wrap; margin: 0;">
            ${mensagem.replace(/\n/g, '<br>')}
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
          Mensagem enviada pela administração do DebtTracker.
        </p>
      </div>
    </div>
  `;

  const text = `
Olá ${nomeUsuario},

${mensagem}

--
Mensagem enviada pela administração do DebtTracker.
  `.trim();

  return enviarEmail({
    to: email,
    subject: assunto,
    text,
    html,
  });
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

/**
 * Testa a conexão com o servidor de email
 */
export async function testarConexaoEmail(): Promise<EmailResult> {
  try {
    if (!isEmailConfigured()) {
      return {
        sucesso: false,
        erro: 'Configurações de email não definidas',
      };
    }

    await transporter.verify();

    return {
      sucesso: true,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || 'Erro ao verificar conexão',
    };
  }
}
