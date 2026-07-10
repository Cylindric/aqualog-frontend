import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from './components/ui/provider'
import App from './App'
import { OidcProvider } from './auth/OidcProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider>
      <OidcProvider>
        <App />
      </OidcProvider>
    </Provider>
  </React.StrictMode>,
)
