import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design-tokens.css'
import 'leaflet/dist/leaflet.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import App from './App.tsx'
import splashLogo from './assets/logo-transparent.png'

const splashElement = document.getElementById('app-splash')
const splashLogoElement = document.getElementById('app-splash-logo') as HTMLImageElement | null

if (splashLogoElement) {
  splashLogoElement.src = splashLogo
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.setTimeout(() => {
  document.body.classList.add('app-ready')

  window.setTimeout(() => {
    splashElement?.remove()
  }, 980)
}, 4020)
