import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { TotemLayout } from '@/layouts/TotemLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/contexts/AuthContext';

const Splash             = lazy(() => import('@/pages/totem/Splash'));
const Welcome            = lazy(() => import('@/pages/totem/Welcome'));
const Menu               = lazy(() => import('@/pages/totem/Menu'));
const ProductDetail      = lazy(() => import('@/pages/totem/ProductDetail'));
const ProductAdded       = lazy(() => import('@/pages/totem/ProductAdded'));
const Cart               = lazy(() => import('@/pages/totem/Cart'));
const CartEmpty          = lazy(() => import('@/pages/totem/CartEmpty'));
const Identification     = lazy(() => import('@/pages/totem/Identification'));
const InvoiceQuestion    = lazy(() => import('@/pages/totem/InvoiceQuestion'));
const InvoiceEmail       = lazy(() => import('@/pages/totem/InvoiceEmail'));
const InvoiceConfirm     = lazy(() => import('@/pages/totem/InvoiceConfirm'));
const OrderSummary       = lazy(() => import('@/pages/totem/OrderSummary'));
const PaymentMethod      = lazy(() => import('@/pages/totem/PaymentMethod'));
const PaymentPix         = lazy(() => import('@/pages/totem/PaymentPix'));
const PaymentProcessing  = lazy(() => import('@/pages/totem/PaymentProcessing'));
const PaymentApproved    = lazy(() => import('@/pages/totem/PaymentApproved'));
const OrderConfirmed     = lazy(() => import('@/pages/totem/OrderConfirmed'));
const PrintingReceipt    = lazy(() => import('@/pages/totem/PrintingReceipt'));

const PaymentDeclined    = lazy(() => import('@/pages/totem/errors/PaymentDeclined'));
const InvalidEmail       = lazy(() => import('@/pages/totem/errors/InvalidEmail'));
const InvalidCPF         = lazy(() => import('@/pages/totem/errors/InvalidCPF'));
const NoConnection       = lazy(() => import('@/pages/totem/errors/NoConnection'));
const SessionExpired     = lazy(() => import('@/pages/totem/errors/SessionExpired'));
const ProductUnavailable = lazy(() => import('@/pages/totem/errors/ProductUnavailable'));

const AdminLogin         = lazy(() => import('@/pages/admin/Login'));
const Dashboard          = lazy(() => import('@/pages/admin/Dashboard'));
const Products           = lazy(() => import('@/pages/admin/Products'));
const ProductForm        = lazy(() => import('@/pages/admin/ProductForm'));
const Categories         = lazy(() => import('@/pages/admin/Categories'));
const Orders             = lazy(() => import('@/pages/admin/Orders'));
const Reports            = lazy(() => import('@/pages/admin/Reports'));

function AdminGuard({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  return isAuth ? <>{children}</> : <Navigate to="/admin/login" replace />;
}
const Loading = () => <div style={{ padding: 32, textAlign: 'center' }}>Carregando…</div>;
const wrap = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

export const routes: RouteObject[] = [
  { path: '/', element: <TotemLayout />, children: [
    { index: true, element: <Navigate to="/splash" replace /> },
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
  ]},
  { path: '/admin/login', element: wrap(<AdminLogin />) },
  { path: '/admin', element: <AdminGuard><AdminLayout /></AdminGuard>, children: [
    { index: true, element: wrap(<Dashboard />) },
    { path: 'products', element: wrap(<Products />) },
    { path: 'products/new', element: wrap(<ProductForm />) },
    { path: 'products/:id', element: wrap(<ProductForm />) },
    { path: 'categories', element: wrap(<Categories />) },
    { path: 'orders', element: wrap(<Orders />) },
    { path: 'reports', element: wrap(<Reports />) },
  ]},
  { path: '*', element: <Navigate to="/splash" replace /> },
];

export const router = createBrowserRouter(routes);
