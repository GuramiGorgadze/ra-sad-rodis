import { StrictMode } from 'react'
import { MotionConfig } from 'motion/react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { initCloud } from './lib/cloud'

const h = location.hash
void initCloud(h.includes('preview') ? 'preview' : h.startsWith('#/screen') ? 'screen' : 'app')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
