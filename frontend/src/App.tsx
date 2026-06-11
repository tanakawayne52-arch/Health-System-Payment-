import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider, ToastContainer } from '@/hooks/useToast';
import AppLayout from '@/components/AppLayout';
import { Spinner } from '@/components/ui/spinner';

// Lazy load pages for better performance and loading states
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const ProvincialDashboard = React.lazy(() => import('@/pages/ProvincialDashboard'));
const HRDashboard = React.lazy(() => import('@/pages/HRDashboard'));
const FinanceDashboard = React.lazy(() => import('@/pages/FinanceDashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const BeneficiariesPage = React.lazy(() => import('@/pages/BeneficiariesPage'));
const PaymentListsPage = React.lazy(() => import('@/pages/PaymentListsPage'));
const PaymentListCreatePage = React.lazy(() => import('@/pages/PaymentListCreatePage'));
const PaymentBatchesPage = React.lazy(() => import('@/pages/PaymentBatchesPage'));
const AuditTrailPage = React.lazy(() => import('@/pages/AuditTrailPage'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'));
const UsersPage = React.lazy(() => import('@/pages/UsersPage'));
const PaymentCyclesPage = React.lazy(() => import('@/pages/PaymentCyclesPage'));
const ReconciliationPage = React.lazy(() => import('@/pages/ReconciliationPage'));
const VhwNationalDashboard = React.lazy(() => import('@/pages/VhwNationalDashboard'));
const VhwProvincialDashboard = React.lazy(() => import('@/pages/VhwProvincialDashboard'));
const VhwDistrictDashboard = React.lazy(() => import('@/pages/VhwDistrictDashboard'));
const VhwMasterRecordsPage = React.lazy(() => import('@/pages/VhwMasterRecordsPage'));
const WorkforceMasterSummaryPage = React.lazy(() => import('@/pages/WorkforceMasterSummaryPage'));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'));
const PhysicalFacilities = React.lazy(() => import('@/pages/PhysicalFacilities'));

import type { UserRole } from '@/types';

// Loading component to show while pages are loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spinner className="w-8 h-8 text-[#0d9488]" />
  </div>
);

function ProtectedRoute({ children, allowedRoles, requireNationalLevel = false }: { children: React.ReactNode; allowedRoles: UserRole[]; requireNationalLevel?: boolean }) {
  const { isAuthenticated, user, isNationalLevel, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  if (requireNationalLevel && !isNationalLevel) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <PageLoader />;
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'provincial_officer': return <ProvincialDashboard />;
    case 'hr_custodian': return <HRDashboard />;
    case 'finance_officer': return <FinanceDashboard />;
    case 'national_admin': return <AdminDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

function NotFoundRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return <Navigate to={isAuthenticated ? '/overview/' : '/login'} replace />;
}



function App() {
  return (
<BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/overview/" replace />} />
              <Route path="/overview/" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><DashboardRouter /></AppLayout></ProtectedRoute>} />

              <Route path="/beneficiaries" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><BeneficiariesPage /></AppLayout></ProtectedRoute>} />


              <Route path="/payment-lists" element={<ProtectedRoute allowedRoles={['provincial_officer', 'finance_officer', 'national_admin']}><AppLayout><PaymentListsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/payment-lists/new" element={<ProtectedRoute allowedRoles={['provincial_officer']}><AppLayout><PaymentListCreatePage /></AppLayout></ProtectedRoute>} />
              <Route path="/payment-batches" element={<ProtectedRoute allowedRoles={['finance_officer', 'national_admin']}><AppLayout><PaymentBatchesPage /></AppLayout></ProtectedRoute>} />
              <Route path="/payment-cycles" element={<ProtectedRoute allowedRoles={['hr_custodian', 'national_admin']}><AppLayout><PaymentCyclesPage /></AppLayout></ProtectedRoute>} />
              <Route path="/reconciliation" element={<ProtectedRoute allowedRoles={['finance_officer', 'national_admin']}><AppLayout><ReconciliationPage /></AppLayout></ProtectedRoute>} />
              <Route path="/audit-trail" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><AuditTrailPage /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['national_admin']}><AppLayout><UsersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/vhw-national-dashboard" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']} requireNationalLevel><AppLayout><VhwNationalDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/vhw-provincial-dashboard" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><VhwProvincialDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/vhw-district-dashboard" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']} requireNationalLevel><AppLayout><VhwDistrictDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/vhw-master-records" element={<ProtectedRoute allowedRoles={['national_admin']}><AppLayout><VhwMasterRecordsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/workforce-summary" element={<ProtectedRoute allowedRoles={['hr_custodian', 'national_admin']}><AppLayout><WorkforceMasterSummaryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowedRoles={['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin']}><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/facilities" element={<ProtectedRoute allowedRoles={['hr_custodian', 'national_admin']}><AppLayout><PhysicalFacilities /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
          </Suspense>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
