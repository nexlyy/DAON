import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/karla/wght.css'
import '@fontsource-variable/karla/wght-italic.css'
import '@fontsource/gowun-batang/400.css'
import '@fontsource/gowun-batang/700.css'
import '@fontsource-variable/noto-sans-kr/wght.css'
import './styles/global.css'
import { I18nProvider } from '@/i18n/I18nProvider'
import { PromoProvider } from '@/promo/PromoProvider'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <I18nProvider>
        <PromoProvider>
          <App />
        </PromoProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
