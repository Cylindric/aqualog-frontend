import { ApiRequestError, apiGet } from './client'

export interface ParameterRecord {
  slug: string
  displayName: string
  description: string | null
  unit: string | null
  createdAt: string
  updatedAt: string
}

interface ParameterPayload {
  slug: string
  display_name: string
  description: string | null
  unit: string | null
  created_at: string
  updated_at: string
}

interface ParameterListResponse {
  success: boolean
  request_id: string
  data: ParameterPayload[]
}

export interface ParameterConfig {
  slug: string
  displayName: string
  unit: string
}

/**
 * Narrows the parameter catalog to entries with a known unit (unit is only
 * null for parameters the backend hasn't finished configuring yet) and
 * reshapes them for display. Shared by both the aquarium threshold editor and
 * the measurements page, which independently duplicated this mapping before.
 */
export function toParameterConfigs(parameters: ParameterRecord[]): ParameterConfig[] {
  return parameters
    .filter((parameter): parameter is ParameterRecord & { unit: string } => parameter.unit !== null)
    .map((parameter) => ({
      slug: parameter.slug,
      displayName: parameter.displayName,
      unit: parameter.unit,
    }))
}

export async function listParameters(signal?: AbortSignal): Promise<ParameterRecord[]> {
  const response = await apiGet<unknown>('/api/v1/parameters', undefined, signal)

  if (!isParameterListResponse(response)) {
    throw new ApiRequestError('Received an unexpected parameter list response shape from the API.', 502)
  }

  return response.data.map(toParameterRecord)
}

function toParameterRecord(payload: ParameterPayload): ParameterRecord {
  return {
    slug: payload.slug,
    displayName: payload.display_name,
    description: payload.description,
    unit: payload.unit,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  }
}

function isParameterPayload(input: unknown): input is ParameterPayload {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.slug === 'string' &&
    typeof obj.display_name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    (obj.unit === null || typeof obj.unit === 'string') &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  )
}

function isParameterListResponse(input: unknown): input is ParameterListResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string' || !Array.isArray(obj.data)) {
    return false
  }

  return obj.data.every((item) => isParameterPayload(item))
}
