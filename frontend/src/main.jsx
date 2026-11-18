import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'

const root = createRoot(document.getElementById('root'))

if (new URLSearchParams(window.location.search).has('prototype')) {
  import('./prototype/PrototypeRoot.jsx').then(({ default: PrototypeRoot }) => {
    root.render(
      <StrictMode>
        <PrototypeRoot />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>,
  )
}
