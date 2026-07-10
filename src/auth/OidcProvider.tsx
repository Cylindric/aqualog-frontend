import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from 'react-oidc-context'
import { setAccessTokenProvider, setRefreshAccessTokenProvider } from '../api/client'
import { config, hasOidcConfig } from '../config'

interface OidcProviderProps {
  children: ReactNode
}

export function OidcProvider({ children }: OidcProviderProps) {
  if (!hasOidcConfig()) {
    return <>{children}</>
  }

  return (
    <AuthProvider
      authority={config.oidcAuthority}
      client_id={config.oidcClientId}
      redirect_uri={config.oidcRedirectUri}
      post_logout_redirect_uri={config.oidcPostLogoutRedirectUri}
      scope={config.oidcScope}
      automaticSilentRenew
      onSigninCallback={() => {
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`
        window.history.replaceState({}, document.title, cleanUrl)
      }}
    >
      {children}
    </AuthProvider>
  )
}

export function AuthTokenBridge() {
  const auth = useAuth()

  useEffect(() => {
    setAccessTokenProvider(() => auth.user?.access_token ?? null)
    setRefreshAccessTokenProvider(async () => {
      try {
        const refreshed = await auth.signinSilent()
        return refreshed?.access_token ?? null
      } catch {
        return null
      }
    })

    return () => {
      setAccessTokenProvider(() => null)
      setRefreshAccessTokenProvider(() => null)
    }
  }, [auth])

  return null
}
