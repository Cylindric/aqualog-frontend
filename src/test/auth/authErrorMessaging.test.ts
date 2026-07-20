import { describe, expect, it } from 'vitest'
import { toAuthFailureGuidance } from '../../auth/authErrorMessaging'

describe('toAuthFailureGuidance', () => {
  it('returns actionable guidance for provider policy denial patterns', () => {
    expect(toAuthFailureGuidance('access_denied by policy')).toMatch(/contact your administrator/i)
    expect(toAuthFailureGuidance('signup is disabled')).toMatch(/contact your administrator/i)
    expect(toAuthFailureGuidance('Invite required')).toMatch(/contact your administrator/i)
  })

  it('returns original message for non-policy errors', () => {
    const original = 'Network timeout while contacting identity provider'
    expect(toAuthFailureGuidance(original)).toBe(original)
  })
})
