import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'
import FaqPage from './pages/public/FaqPage'
import HomePage from './pages/public/HomePage'
import NewsArticlePage from './pages/public/NewsArticlePage'
import NewsListPage from './pages/public/NewsListPage'
import ServicesPage from './pages/public/ServicesPage'
import TrackingPage from './pages/public/TrackingPage'

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
    </Routes>
  )
}
