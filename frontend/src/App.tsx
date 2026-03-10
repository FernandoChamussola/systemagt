import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Devedores from './pages/Devedores';
import DevedorDetalhes from './pages/DevedorDetalhes';
import Dividas from './pages/Dividas';
import DividaDetalhes from './pages/DividaDetalhes';
import Notificacoes from './pages/Notificacoes';
import Relatorios from './pages/Relatorios';
import Definicoes from './pages/Definicoes';
import Avisos from './pages/Avisos';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDebts from './pages/AdminDebts';
import AdminDebtors from './pages/AdminDebtors';
import AdminNotices from './pages/AdminNotices';
import AdminAccessLogs from './pages/AdminAccessLogs';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devedores"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Devedores />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devedores/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DevedorDetalhes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dividas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dividas />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dividas/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DividaDetalhes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notificacoes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Notificacoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Relatorios />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
           <Route
              path="/definicoes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Definicoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/avisos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Avisos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminUsers />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/debts"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminDebts />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/debtors"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminDebtors />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/notices"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminNotices />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/access-logs"
              element={
                <AdminProtectedRoute>
                  <AppLayout>
                    <AdminAccessLogs />
                  </AppLayout>
                </AdminProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
