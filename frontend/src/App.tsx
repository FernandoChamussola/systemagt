import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devedores from './pages/Devedores';
import DevedorDetalhes from './pages/DevedorDetalhes';
import Dividas from './pages/Dividas';
import DividaDetalhes from './pages/DividaDetalhes';
import Notificacoes from './pages/Notificacoes';
import Relatorios from './pages/Relatorios';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
