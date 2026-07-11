import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from './components/ui/provider'
import App from './App'
import { OidcProvider } from './auth/OidcProvider'
import { loadRuntimeConfig } from './config'

async function bootstrap() {
  await loadRuntimeConfig()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider>
        <OidcProvider>
          <App />
        </OidcProvider>
      </Provider>
    </React.StrictMode>,
  )
}

void bootstrap()
