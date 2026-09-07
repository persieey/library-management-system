import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import theme from './theme'
import { AuthProvider } from './auth/AuthProvider'
import { PRProvider } from './context/PRContext'
import { EventProvider } from './context/EventContext'
import { BookProvider } from './context/BookContext'
import { EbookProvider } from './context/EbookContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PRProvider>
          <EventProvider>
            <BookProvider>
              <EbookProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </EbookProvider>
            </BookProvider>
          </EventProvider>
        </PRProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
