import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { CustomerShell } from './components/customer/CustomerShell'
import { ProtectedRoute } from './components/customer/ProtectedRoute'
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

// Route groups mirror the Component Spec batches:
//   /          Batch 1 — Public Pages
//   /app/*     Batch 2 — Customer Zone (auth-gated)
//   /admin/*   Batch 3 — Admin Console (staff/admin-gated)
// Each batch replaces its placeholder as it's built.
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
    </Routes>
  )
}
