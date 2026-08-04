import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Design tokens — imported once, globally. Every component references these
// CSS variables; nothing hardcodes a colour, size, radius, or spacing value.
import '../../design-system/tokens.css'
import './styles/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
