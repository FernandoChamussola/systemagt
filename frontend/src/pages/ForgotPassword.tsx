import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Phone, Lock, ArrowLeft, Loader2, Mail, MessageSquare } from 'lucide-react';
import { authApi } from '@/lib/api';

type RecoveryMethod = 'email' | 'whatsapp';
type Step = 'method' | 'input' | 'code' | 'password';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<RecoveryMethod>('email');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [maskedDestination, setMaskedDestination] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (method === 'email') {
        response = await authApi.requestPasswordResetByEmail(email);
      } else {
        response = await authApi.requestPasswordReset(telefone);
      }
      setMaskedDestination(response.codeSentTo);
      setStep('code');
      toast({
        title: 'Codigo enviado!',
        description: `Um codigo foi enviado para ${response.codeSentTo}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao enviar codigo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (method === 'email') {
        response = await authApi.verifyResetCodeByEmail(email, codigo);
      } else {
        response = await authApi.verifyResetCode(telefone, codigo);
      }
      setResetToken(response.resetToken);
      setStep('password');
      toast({
        title: 'Codigo verificado!',
        description: 'Agora voce pode criar uma nova senha',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Codigo invalido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas nao coincidem',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(resetToken, novaSenha);
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi alterada com sucesso',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao alterar senha',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function selectMethod(selectedMethod: RecoveryMethod) {
    setMethod(selectedMethod);
    setStep('input');
  }

  function goBack() {
    if (step === 'input') {
      setStep('method');
    } else if (step === 'code') {
      setStep('input');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Recuperar Senha</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'method' && 'Escolha como deseja recuperar sua senha'}
            {step === 'input' && (method === 'email' ? 'Informe seu email' : 'Informe seu telefone')}
            {step === 'code' && 'Digite o codigo recebido'}
            {step === 'password' && 'Crie sua nova senha'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* STEP 1: Choose Method */}
          {step === 'method' && (
            <div className="space-y-4">
              <button
                onClick={() => selectMethod('email')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">Receber codigo por email</p>
                </div>
              </button>

              <button
                onClick={() => selectMethod('whatsapp')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Receber codigo por WhatsApp</p>
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: Input Email or Phone */}
          {step === 'input' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              {method === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o email cadastrado na sua conta
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="telefone">Numero de Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="845678901"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o telefone cadastrado na sua conta
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Codigo'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={goBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </form>
          )}

          {/* STEP 3: Verification Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo de Verificacao</Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="123456"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Codigo enviado para {maskedDestination}. Valido por 10 minutos.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Codigo'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={goBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </form>
          )}

          {/* STEP 4: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="novaSenha"
                    type="password"
                    placeholder="********"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="********"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
