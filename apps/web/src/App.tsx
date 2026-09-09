import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { CustomerShell } from './components/customer/CustomerShell'
import { ProtectedRoute } from './components/customer/ProtectedRoute'
import { AdminShell } from './components/admin/AdminShell'
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute'
import { AdminOnlyGuard } from './components/admin/AdminOnlyGuard'
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'
import FaqPage from './pages/public/FaqPage'
import HomePage from './pages/public/HomePage'
import NewsArticlePage from './pages/public/NewsArticlePage'
import NewsListPage from './pages/public/NewsListPage'
import ServicesPage from './pages/public/ServicesPage'
import TrackingPage from './pages/public/TrackingPage'
import ForgotPasswordPage from './pages/customer/auth/ForgotPasswordPage'
import LoginPage from './pages/customer/auth/LoginPage'
import RegisterPage from './pages/customer/auth/RegisterPage'
import ResetPasswordPage from './pages/customer/auth/ResetPasswordPage'
import DashboardPage from './pages/customer/app/DashboardPage'
import InvoiceDetailPage from './pages/customer/app/InvoiceDetailPage'
import InvoicesPage from './pages/customer/app/InvoicesPage'
import PointsPage from './pages/customer/app/PointsPage'
import ProfilePage from './pages/customer/app/ProfilePage'
import ReferralPage from './pages/customer/app/ReferralPage'
import CustomerTrackingPage from './pages/customer/app/TrackingPage'
import AdminLoginPage from './pages/admin/LoginPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminBillsPage from './pages/admin/BillsPage'
import AdminRatesPage from './pages/admin/RatesPage'
import AdminPointsConfigPage from './pages/admin/PointsConfigPage'
import AdminReferralPage from './pages/admin/ReferralPage'
import AdminNewsPage from './pages/admin/NewsPage'
import AdminFaqPage from './pages/admin/FaqPage'
import AdminReviewsPage from './pages/admin/ReviewsPage'
import AdminNotifPage from './pages/admin/NotifPage'
import AdminStaffPage from './pages/admin/StaffPage'
import AdminAccountPage from './pages/admin/AccountPage'

// Route groups mirror the Component Spec batches:
//   /          Batch 1 — Public Pages
//   /app/*     Batch 2 — Customer Zone (auth-gated)
//   /admin/*   Batch 3 — Admin Console (staff/admin-gated)
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:id" element={<NewsArticlePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      <Route path="/app/register" element={<RegisterPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/app/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerShell />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/points" element={<PointsPage />} />
          <Route path="/app/referral" element={<ReferralPage />} />
          <Route path="/app/invoices" element={<InvoicesPage />} />
          <Route path="/app/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/app/tracking" element={<CustomerTrackingPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/bills" element={<AdminBillsPage />} />
          <Route path="/admin/rates" element={<AdminRatesPage />} />
          <Route
            path="/admin/points"
            element={
              <AdminOnlyGuard page="points">
                <AdminPointsConfigPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/referral"
            element={
              <AdminOnlyGuard page="referral">
                <AdminReferralPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/news"
            element={
              <AdminOnlyGuard page="news">
                <AdminNewsPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/faq"
            element={
              <AdminOnlyGuard page="faq">
                <AdminFaqPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminOnlyGuard page="reviews">
                <AdminReviewsPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminOnlyGuard page="notif">
                <AdminNotifPage />
              </AdminOnlyGuard>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <AdminOnlyGuard page="staff">
                <AdminStaffPage />
              </AdminOnlyGuard>
            }
          />
          <Route path="/admin/account" element={<AdminAccountPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
