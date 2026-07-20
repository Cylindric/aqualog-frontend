export function toAuthFailureGuidance(errorMessage: string): string {
  const message = errorMessage.toLowerCase()

  if (
    message.includes('access_denied') ||
    message.includes('access denied') ||
    message.includes('registration') ||
    message.includes('enrollment') ||
    message.includes('enrolment') ||
    message.includes('signup') ||
    message.includes('sign up') ||
    message.includes('invite')
  ) {
    return 'Authentication was denied by the identity provider. If you just created an account, try signing in again. If access is still denied, contact your administrator.'
  }

  return errorMessage
}
