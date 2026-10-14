import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { TotemLayout } from '@/layouts/TotemLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { InicioLayout } from '@/layouts/InicioLayout';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { useAuthStore } from '@/contexts/AuthContext';
import { useSuperAdminStore } from '@/contexts/SuperAdminContext';
import { authService } from '@/services/auth';

/* ─── INÍCIO (site institucional) ─── */
const Home = lazy(() => import('@/pages/inicio/Home'));
const Plans = lazy(() => import('@/pages/inicio/Plans'));
const Signup = lazy(() => import('@/pages/inicio/Signup'));
const Login = lazy(() => import('@/pages/inicio/Login'));
const Checkout = lazy(() => import('@/pages/inicio/Checkout'));
const Resources = lazy(() => import('@/pages/inicio/Resources'));
const About = lazy(() => import('@/pages/inicio/About'));
const Contact = lazy(() => import('@/pages/inicio/Contact'));
const Terms = lazy(() => import('@/pages/inicio/Terms'));
const Privacy = lazy(() => import('@/pages/inicio/Privacy'));
const ForgotPassword = lazy(() => import('@/pages/inicio/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/inicio/ResetPassword'));
const SignupWelcome = lazy(() => import('@/pages/inicio/Welcome'));

/* ─── TOTEM ─── */
const Splash = lazy(() => import('@/pages/totem/Splash'));
const TotemLogin = lazy(() => import('@/pages/totem/Login'));
const Welcome = lazy(() => import('@/pages/totem/Welcome'));
const Menu = lazy(() => import('@/pages/totem/Menu'));
const ProductDetail = lazy(() => import('@/pages/totem/ProductDetail'));
const ProductAdded = lazy(() => import('@/pages/totem/ProductAdded'));
const Cart = lazy(() => import('@/pages/totem/Cart'));
const CartEmpty = lazy(() => import('@/pages/totem/CartEmpty'));
const Identification = lazy(() => import('@/pages/totem/Identification'));
const InvoiceQuestion = lazy(() => import('@/pages/totem/InvoiceQuestion'));
const InvoiceEmail = lazy(() => import('@/pages/totem/InvoiceEmail'));
const InvoiceConfirm = lazy(() => import('@/pages/totem/InvoiceConfirm'));
const OrderSummary = lazy(() => import('@/pages/totem/OrderSummary'));
const PaymentMethod = lazy(() => import('@/pages/totem/PaymentMethod'));
const PaymentPix = lazy(() => import('@/pages/totem/PaymentPix'));
const PaymentProcessing = lazy(() => import('@/pages/totem/PaymentProcessing'));
const PaymentApproved = lazy(() => import('@/pages/totem/PaymentApproved'));
const OrderConfirmed = lazy(() => import('@/pages/totem/OrderConfirmed'));
const PrintingReceipt = lazy(() => import('@/pages/totem/PrintingReceipt'));
const PaymentDeclined = lazy(() => import('@/pages/totem/errors/PaymentDeclined'));
const InvalidEmail = lazy(() => import('@/pages/totem/errors/InvalidEmail'));
const InvalidCPF = lazy(() => import('@/pages/totem/errors/InvalidCPF'));
const NoConnection = lazy(() => import('@/pages/totem/errors/NoConnection'));
const SessionExpired = lazy(() => import('@/pages/totem/errors/SessionExpired'));
const ProductUnavailable = lazy(() => import('@/pages/totem/errors/ProductUnavailable'));

/* ─── ADMIN DA LOJA ─── */
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Products = lazy(() => import('@/pages/admin/Products'));
const ProductForm = lazy(() => import('@/pages/admin/ProductForm'));
const Categories = lazy(() => import('@/pages/admin/Categories'));
const Orders = lazy(() => import('@/pages/admin/Orders'));
const Reports = lazy(() => import('@/pages/admin/Reports'));

/* ─── SUPERADMIN ─── */
const SuperLogin = lazy(() => import('@/pages/superadmin/Login'));
const SuperOverview = lazy(() => import('@/pages/superadmin/Overview'));
const SuperTenants = lazy(() => import('@/pages/superadmin/Tenants'));
const SuperInvoices = lazy(() => import('@/pages/superadmin/Invoices'));
const SuperPlans = lazy(() => import('@/pages/superadmin/Plans'));
const SuperReports = lazy(() => import('@/pages/superadmin/Reports'));
const SuperSettings = lazy(() => import('@/pages/superadmin/Settings'));

function useSessionCheck(isAuth: boolean) {
  const [checking, setChecking] = useState(!isAuth);
  useEffect(() => {
    if (!isAuth) void authService.restore().catch(() => undefined).finally(() => setChecking(false));
  }, []);
  return checking;
}
function AdminGuard({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  const role = useAuthStore((s) => s.user?.role);
  const checking = useSessionCheck(isAuth);
  if (checking) return <Loading />;
  return isAuth && role === 'gerente' ? <>{children}</> : <Navigate to="/entrar" replace />;
}
function SuperAdminGuard({ children }: { children: ReactNode }) {
  const isAuth = useSuperAdminStore((s) => s.isAuthenticated());
  const checking = useSessionCheck(isAuth);
  if (checking) return <Loading />;
  return isAuth ? <>{children}</> : <Navigate to="/superadmin/login" replace />;
}
function TotemGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  const checking = useSessionCheck(Boolean(user));
  if (checking) return <Loading />;
  return user && (user.role === 'totem' || user.role === 'gerente') ? <>{children}</> : <Navigate to="/totem/login" replace />;
}

const Loading = () => <div style={{ padding: 32, textAlign: 'center' }}>Carregando…</div>;
const wrap = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

export const routes: RouteObject[] = [
  /* ─── INÍCIO (raiz) ─── */
  {
    path: '/',
    element: <InicioLayout />,
    children: [
      { index: true, element: wrap(<Home />) },
      { path: 'planos', element: wrap(<Plans />) },
      { path: 'recursos', element: wrap(<Resources />) },
      { path: 'sobre', element: wrap(<About />) },
      { path: 'cadastro', element: wrap(<Signup />) },
      { path: 'entrar', element: wrap(<Login />) },
      { path: 'checkout/:planoId', element: wrap(<Checkout />) },
      { path: 'contato', element: wrap(<Contact />) },
      { path: 'termos', element: wrap(<Terms />) },
      { path: 'privacidade', element: wrap(<Privacy />) },
      { path: 'recuperar-senha', element: wrap(<ForgotPassword />) },
      { path: 'redefinir-senha', element: wrap(<ResetPassword />) },
      { path: 'boas-vindas', element: wrap(<SignupWelcome />) },
    ],
  },

  /* ─── TOTEM ─── */
  { path: '/totem/login', element: wrap(<TotemLogin />) },
  {
    path: '/totem',
    element: <TotemGuard><TotemLayout /></TotemGuard>,
    children: [
      { index: true, element: <Navigate to="/totem/splash" replace /> },
      { path: 'splash', element: wrap(<Splash />) },
      { path: 'welcome', element: wrap(<Welcome />) },
      { path: 'menu', element: wrap(<Menu />) },
      { path: 'product/:id', element: wrap(<ProductDetail />) },
      { path: 'product-added', element: wrap(<ProductAdded />) },
      { path: 'cart', element: wrap(<Cart />) },
      { path: 'cart-empty', element: wrap(<CartEmpty />) },
      { path: 'identification', element: wrap(<Identification />) },
      { path: 'invoice-email', element: wrap(<InvoiceQuestion />) },
      { path: 'invoice-email/input', element: wrap(<InvoiceEmail />) },
      { path: 'invoice-email/confirm', element: wrap(<InvoiceConfirm />) },
      { path: 'order/summary', element: wrap(<OrderSummary />) },
      { path: 'payment', element: wrap(<PaymentMethod />) },
      { path: 'payment/pix', element: wrap(<PaymentPix />) },
      { path: 'payment/processing', element: wrap(<PaymentProcessing />) },
      { path: 'payment/approved', element: wrap(<PaymentApproved />) },
      { path: 'order/confirmed', element: wrap(<OrderConfirmed />) },
      { path: 'order/printing', element: wrap(<PrintingReceipt />) },
      { path: 'error/payment-declined', element: wrap(<PaymentDeclined />) },
      { path: 'error/invalid-email', element: wrap(<InvalidEmail />) },
      { path: 'error/invalid-cpf', element: wrap(<InvalidCPF />) },
      { path: 'error/no-connection', element: wrap(<NoConnection />) },
      { path: 'error/session-expired', element: wrap(<SessionExpired />) },
      { path: 'error/product-unavailable', element: wrap(<ProductUnavailable />) },
    ],
  },

  /* ─── ADMIN DA LOJA ─── */
  {
    path: '/admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: wrap(<Dashboard />) },
      { path: 'products', element: wrap(<Products />) },
      { path: 'products/new', element: wrap(<ProductForm />) },
      { path: 'products/:id', element: wrap(<ProductForm />) },
      { path: 'categories', element: wrap(<Categories />) },
      { path: 'orders', element: wrap(<Orders />) },
      { path: 'reports', element: wrap(<Reports />) },
    ],
  },

  /* ─── SUPERADMIN ─── */
  { path: '/superadmin/login', element: wrap(<SuperLogin />) },
  {
    path: '/superadmin',
    element: <SuperAdminGuard><SuperAdminLayout /></SuperAdminGuard>,
    children: [
      { index: true, element: wrap(<SuperOverview />) },
      { path: 'clientes', element: wrap(<SuperTenants />) },
      { path: 'boletos', element: wrap(<SuperInvoices />) },
      { path: 'planos', element: wrap(<SuperPlans />) },
      { path: 'relatorios', element: wrap(<SuperReports />) },
      { path: 'configuracoes', element: wrap(<SuperSettings />) },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
];

export const router = createBrowserRouter(routes);
