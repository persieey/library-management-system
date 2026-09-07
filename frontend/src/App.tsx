import './styles/staff.css'
import { LoginPromptProvider } from './context/LoginPrompt'
import AppRoutes from './routes'

function App() {
  return (
    <LoginPromptProvider>
      <AppRoutes />
    </LoginPromptProvider>
  )
}

export default App
