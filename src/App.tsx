import { BrowserRouter, Route, Routes } from 'react-router'
import { Shell } from './components/Shell'
import { ConfigErrorPage } from './pages/ConfigErrorPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { isConfigured } from './config'

export default function App() {
  if (!isConfigured()) {
    return <ConfigErrorPage />
  }

  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
