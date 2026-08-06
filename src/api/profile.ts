import { ApiRequestError, apiGet, apiPatch } from './client'

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  created_at: string
  updated_at: string
  groups: string[]
}

const AQUALOG_ADMINS_GROUP = 'AquaLogAdmins'

export function isAquaLogAdmin(profile: UserProfile): boolean {
  return profile.groups.includes(AQUALOG_ADMINS_GROUP)
}

export interface UpdateProfileInput {
  display_name?: string
}

// The raw API response may omit `groups` (older/mismatched backend
// responses) — normalized to `UserProfile.groups: []` before being
// returned to callers, see `normalizeUserProfile`.
interface RawUserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  created_at: string
  updated_at: string
  groups?: string[]
}

interface UserProfileResponse {
  success: boolean
  request_id: string
  data: RawUserProfile
}

function normalizeUserProfile(raw: RawUserProfile): UserProfile {
  return { ...raw, groups: raw.groups ?? [] }
}

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await apiGet<unknown>('/api/v1/me', undefined, signal)
  if (!isUserProfileResponse(response)) {
    throw new ApiRequestError('Received an unexpected profile response shape from the API.', 502)
  }

  return normalizeUserProfile(response.data)
}

export async function updateMyProfile(
  patch: UpdateProfileInput,
  signal?: AbortSignal,
): Promise<UserProfile> {
  const response = await apiPatch<unknown>('/api/v1/me', patch, signal)
  if (!isUserProfileResponse(response)) {
    throw new ApiRequestError('Received an unexpected profile response shape from the API.', 502)
  }

  return normalizeUserProfile(response.data)
}

function isRawUserProfile(input: unknown): input is RawUserProfile {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    (typeof obj.username === 'string' || obj.username === null) &&
    (typeof obj.display_name === 'string' || obj.display_name === null) &&
    (typeof obj.bio === 'string' || obj.bio === null) &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string' &&
    (obj.groups === undefined ||
      (Array.isArray(obj.groups) && obj.groups.every((group) => typeof group === 'string')))
  )
}

function isUserProfileResponse(input: unknown): input is UserProfileResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isRawUserProfile(obj.data)
  )
}
