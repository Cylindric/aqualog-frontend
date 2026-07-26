import { ApiRequestError, apiGet, apiPatch } from './client'

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileInput {
  display_name?: string
}

interface UserProfileResponse {
  success: boolean
  request_id: string
  data: UserProfile
}

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await apiGet<unknown>('/api/v1/me', undefined, signal)
  if (!isUserProfileResponse(response)) {
    throw new ApiRequestError('Received an unexpected profile response shape from the API.', 502)
  }

  return response.data
}

export async function updateMyProfile(
  patch: UpdateProfileInput,
  signal?: AbortSignal,
): Promise<UserProfile> {
  const response = await apiPatch<unknown>('/api/v1/me', patch, signal)
  if (!isUserProfileResponse(response)) {
    throw new ApiRequestError('Received an unexpected profile response shape from the API.', 502)
  }

  return response.data
}

function isUserProfile(input: unknown): input is UserProfile {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    (typeof obj.username === 'string' || obj.username === null) &&
    (typeof obj.display_name === 'string' || obj.display_name === null) &&
    (typeof obj.bio === 'string' || obj.bio === null) &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  )
}

function isUserProfileResponse(input: unknown): input is UserProfileResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isUserProfile(obj.data)
  )
}
