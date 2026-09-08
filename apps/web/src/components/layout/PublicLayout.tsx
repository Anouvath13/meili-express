import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}
