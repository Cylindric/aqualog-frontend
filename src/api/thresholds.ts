import { ApiRequestError, apiGet, apiPut } from './client'

export type ThresholdParameter = 'temperature' | 'salinity' | 'phosphate'

export interface ThresholdRecord {
  aquariumId: string
  parameter: ThresholdParameter
  target: number | null
  min: number | null
  max: number | null
  unit: string
}

export interface SetThresholdInput {
  target: number | null
  min: number | null
  max: number | null
}

interface ThresholdPayload {
  aquarium_id: string
  parameter: string
  target: number | null
  min: number | null
  max: number | null
  unit: string
}

interface ThresholdResponse {
  success: boolean
  request_id: string
  data: ThresholdPayload
}

// Mirrors backend/src/aquarium_parameter_thresholds.py's THRESHOLD_SANITY_RANGES.
export const THRESHOLD_SANITY_RANGES: Record<ThresholdParameter, { min: number; max: number }> = {
  temperature: { min: 0, max: 45 },
  salinity: { min: 0, max: 100 },
  phosphate: { min: 0, max: 100 },
}

// Mirrors backend/src/aquarium_parameter_thresholds.py's THRESHOLD_UNITS.
export const THRESHOLD_UNITS: Record<ThresholdParameter, string> = {
  temperature: 'celsius',
  salinity: 'ppt',
  phosphate: 'ppm',
}

export async function getThreshold(
  aquariumId: string,
  parameter: ThresholdParameter,
  signal?: AbortSignal,
): Promise<ThresholdRecord> {
  const response = await apiGet<unknown>(
    `/api/v1/aquariums/${aquariumId}/thresholds/${parameter}`,
    undefined,
    signal,
  )
  if (!isThresholdResponse(response)) {
    throw new ApiRequestError('Received an unexpected threshold response shape from the API.', 502)
  }

  return toThresholdRecord(response.data)
}

export async function setThreshold(
  aquariumId: string,
  parameter: ThresholdParameter,
  input: SetThresholdInput,
  signal?: AbortSignal,
): Promise<ThresholdRecord> {
  const response = await apiPut<unknown>(
    `/api/v1/aquariums/${aquariumId}/thresholds/${parameter}`,
    input,
    signal,
  )
  if (!isThresholdResponse(response)) {
    throw new ApiRequestError('Received an unexpected threshold response shape from the API.', 502)
  }

  return toThresholdRecord(response.data)
}

function toThresholdRecord(payload: ThresholdPayload): ThresholdRecord {
  return {
    aquariumId: payload.aquarium_id,
    parameter: payload.parameter as ThresholdParameter,
    target: payload.target,
    min: payload.min,
    max: payload.max,
    unit: payload.unit,
  }
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number'
}

function isThresholdPayload(input: unknown): input is ThresholdPayload {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.aquarium_id === 'string' &&
    typeof obj.parameter === 'string' &&
    isNullableNumber(obj.target) &&
    isNullableNumber(obj.min) &&
    isNullableNumber(obj.max) &&
    typeof obj.unit === 'string'
  )
}

function isThresholdResponse(input: unknown): input is ThresholdResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isThresholdPayload(obj.data)
  )
}
