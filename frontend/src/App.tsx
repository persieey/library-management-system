import './styles/staff.css'
import { LoginPromptProvider } from './context/LoginPrompt'
import AppRoutes from './routes'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <LoginPromptProvider>
      <ScrollToTop />
      <AppRoutes />
    </LoginPromptProvider>
  )
}

export default App
