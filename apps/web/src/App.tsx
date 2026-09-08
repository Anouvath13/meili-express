import { Route, Routes } from 'react-router-dom'
import SetupStatus from './pages/SetupStatus'

// Route groups mirror the Component Spec batches:
//   /          Batch 1 — Public Pages
//   /app/*     Batch 2 — Customer Zone (auth-gated)
//   /admin/*   Batch 3 — Admin Console (staff/admin-gated)
// Each batch replaces its placeholder as it's built.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupStatus />} />
    </Routes>
  )
}
