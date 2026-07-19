import { ApiRequestError, apiGet, apiPost } from './client'

export type SalinityUnit = 'ppt'

export interface SalinityMeasurementRecord {
  id: string
  aquariumId: string
  parameter: string
  value: number
  unit: SalinityUnit
  rawValue: number
  rawUnit: string
  measuredAt: string
  createdAt: string
}

export interface CreateSalinityMeasurementInput {
  value: number
  measuredAt: string
}

interface SalinityMeasurementPayload {
  id: string
  aquarium_id: string
  parameter: string
  value: number
  unit: string
  raw_value: number
  raw_unit: string
  measured_at: string
  created_at: string
}

interface SalinityMeasurementResponse {
  success: boolean
  request_id: string
  data: SalinityMeasurementPayload
}

interface SalinityMeasurementListResponse {
  success: boolean
  request_id: string
  data: SalinityMeasurementPayload[]
}

export async function listSalinityMeasurements(
  aquariumId: string,
  signal?: AbortSignal,
): Promise<SalinityMeasurementRecord[]> {
  const response = await apiGet<unknown>(
    `/api/v1/aquariums/${aquariumId}/measurements/salinity`,
    undefined,
    signal,
  )

  if (!isSalinityMeasurementListResponse(response)) {
    throw new ApiRequestError('Received an unexpected salinity measurement list response shape from the API.', 502)
  }

  return response.data.map(toSalinityMeasurementRecord)
}

export async function createSalinityMeasurement(
  aquariumId: string,
  input: CreateSalinityMeasurementInput,
  signal?: AbortSignal,
): Promise<SalinityMeasurementRecord> {
  const response = await apiPost<unknown>(
    `/api/v1/aquariums/${aquariumId}/measurements/salinity`,
    {
      unit: 'ppt',
      value: input.value,
      measured_at: input.measuredAt,
    },
    signal,
  )

  if (!isSalinityMeasurementResponse(response)) {
    throw new ApiRequestError('Received an unexpected salinity measurement response shape from the API.', 502)
  }

  return toSalinityMeasurementRecord(response.data)
}

function toSalinityMeasurementRecord(payload: SalinityMeasurementPayload): SalinityMeasurementRecord {
  return {
    id: payload.id,
    aquariumId: payload.aquarium_id,
    parameter: payload.parameter,
    value: payload.value,
    unit: payload.unit === 'ppt' ? 'ppt' : 'ppt',
    rawValue: payload.raw_value,
    rawUnit: payload.raw_unit,
    measuredAt: payload.measured_at,
    createdAt: payload.created_at,
  }
}

function isSalinityMeasurementPayload(input: unknown): input is SalinityMeasurementPayload {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    typeof obj.aquarium_id === 'string' &&
    typeof obj.parameter === 'string' &&
    typeof obj.value === 'number' &&
    typeof obj.unit === 'string' &&
    typeof obj.raw_value === 'number' &&
    typeof obj.raw_unit === 'string' &&
    typeof obj.measured_at === 'string' &&
    typeof obj.created_at === 'string'
  )
}

function isSalinityMeasurementResponse(input: unknown): input is SalinityMeasurementResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isSalinityMeasurementPayload(obj.data)
  )
}

function isSalinityMeasurementListResponse(input: unknown): input is SalinityMeasurementListResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string' || !Array.isArray(obj.data)) {
    return false
  }

  return obj.data.every((item) => isSalinityMeasurementPayload(item))
}
