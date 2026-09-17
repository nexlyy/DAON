import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { I18nProvider } from '@/i18n/I18nProvider'
import { PromoProvider } from '@/promo/PromoProvider'
import { App } from './App'

export { dishes } from '@/data/menu/dishes'
export { restaurant, hoursFor, weekOrder } from '@/data/restaurant'

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={import.meta.env.BASE_URL}>
        <I18nProvider>
          <PromoProvider>
            <App />
          </PromoProvider>
        </I18nProvider>
      </StaticRouter>
    </StrictMode>,
  )
}
