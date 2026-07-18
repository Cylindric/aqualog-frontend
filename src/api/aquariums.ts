import { ApiRequestError, apiDelete, apiGet, apiPatch, apiPost } from './client'

export type AquariumVolumeUnit =
  | 'L'
  | 'gal_us'

export interface AquariumRecord {
  id: string
  name: string
  type: string
  volumeLiters: number
  createdAt: string
  updatedAt: string
}

export interface AquariumVolumeInput {
  value: number
  unit: AquariumVolumeUnit
}

export interface CreateAquariumInput {
  name: string
  type: string
  volume: AquariumVolumeInput
}

export interface UpdateAquariumInput {
  name?: string
  type?: string
  volume?: AquariumVolumeInput
}

interface AquariumPayload {
  id: string
  name: string
  type: string
  volume_liters: number
  created_at: string
  updated_at: string
}

interface AquariumListResponse {
  success: boolean
  request_id: string
  data: AquariumPayload[]
}

interface AquariumResponse {
  success: boolean
  request_id: string
  data: AquariumPayload
}

interface DeleteAquariumResponse {
  success: boolean
  request_id: string
  data: {
    id: string
    deleted: boolean
  }
}

export async function listAquariums(signal?: AbortSignal): Promise<AquariumRecord[]> {
  const response = await apiGet<unknown>('/api/v1/aquariums', undefined, signal)
  if (!isAquariumListResponse(response)) {
    throw new ApiRequestError('Received an unexpected aquarium list response shape from the API.', 502)
  }

  return response.data.map(toAquariumRecord)
}

export async function createAquarium(
  input: CreateAquariumInput,
  signal?: AbortSignal,
): Promise<AquariumRecord> {
  const response = await apiPost<unknown>('/api/v1/aquariums', input, signal)
  if (!isAquariumResponse(response)) {
    throw new ApiRequestError('Received an unexpected aquarium response shape from the API.', 502)
  }

  return toAquariumRecord(response.data)
}

export async function updateAquarium(
  aquariumId: string,
  input: UpdateAquariumInput,
  signal?: AbortSignal,
): Promise<AquariumRecord> {
  const response = await apiPatch<unknown>(`/api/v1/aquariums/${aquariumId}`, input, signal)
  if (!isAquariumResponse(response)) {
    throw new ApiRequestError('Received an unexpected aquarium response shape from the API.', 502)
  }

  return toAquariumRecord(response.data)
}

export async function deleteAquarium(aquariumId: string, signal?: AbortSignal): Promise<void> {
  const response = await apiDelete<unknown>(`/api/v1/aquariums/${aquariumId}`, signal)
  if (!isDeleteAquariumResponse(response)) {
    throw new ApiRequestError('Received an unexpected aquarium delete response shape from the API.', 502)
  }
}

function toAquariumRecord(payload: AquariumPayload): AquariumRecord {
  return {
    id: payload.id,
    name: payload.name,
    type: payload.type,
    volumeLiters: payload.volume_liters,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  }
}

function isAquariumPayload(input: unknown): input is AquariumPayload {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.volume_liters === 'number' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  )
}

function isAquariumResponse(input: unknown): input is AquariumResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isAquariumPayload(obj.data)
  )
}

function isAquariumListResponse(input: unknown): input is AquariumListResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>
  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string' || !Array.isArray(obj.data)) {
    return false
  }

  return obj.data.every((item) => isAquariumPayload(item))
}

function isDeleteAquariumResponse(input: unknown): input is DeleteAquariumResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>
  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string') return false
  if (typeof obj.data !== 'object' || obj.data === null) return false

  const data = obj.data as Record<string, unknown>
  return typeof data.id === 'string' && typeof data.deleted === 'boolean'
}
