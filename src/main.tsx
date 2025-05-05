
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/chat-themes.css'
import { checkEnvironment } from './debug.ts'
import { ThemeProvider } from './components/theme-provider'

// Check the browser environment
checkEnvironment();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" defaultChatTheme="default">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
