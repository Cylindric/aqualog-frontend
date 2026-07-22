import { ApiRequestError, apiDelete, apiGet, apiPost } from './client'

export type MeasurementParameter = 'salinity' | 'phosphate'
export type MeasurementUnit = 'ppt' | 'ppm'

export interface MeasurementRecord {
  id: string
  aquariumId: string
  parameter: MeasurementParameter
  value: number
  unit: MeasurementUnit
  rawValue: number
  rawUnit: string
  measuredAt: string
  createdAt: string
}

export type SalinityMeasurementRecord = MeasurementRecord

export interface CreateMeasurementInput {
  value: number
  measuredAt: string
}

export type CreateSalinityMeasurementInput = CreateMeasurementInput

interface MeasurementPayload {
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

interface MeasurementResponse {
  success: boolean
  request_id: string
  data: MeasurementPayload
}

interface MeasurementListResponse {
  success: boolean
  request_id: string
  data: MeasurementPayload[]
}

interface DeleteMeasurementResponse {
  success: boolean
  request_id: string
  data: {
    id: string
    deleted: boolean
  }
}

export async function listSalinityMeasurements(
  aquariumId: string,
  signal?: AbortSignal,
): Promise<MeasurementRecord[]> {
  return listMeasurementsByParameter(aquariumId, 'salinity', signal)
}

export async function listPhosphateMeasurements(
  aquariumId: string,
  signal?: AbortSignal,
): Promise<MeasurementRecord[]> {
  return listMeasurementsByParameter(aquariumId, 'phosphate', signal)
}

export async function createSalinityMeasurement(
  aquariumId: string,
  input: CreateSalinityMeasurementInput,
  signal?: AbortSignal,
): Promise<MeasurementRecord> {
  return createMeasurementByParameter(aquariumId, 'salinity', 'ppt', input, signal)
}

export async function createPhosphateMeasurement(
  aquariumId: string,
  input: CreateMeasurementInput,
  signal?: AbortSignal,
): Promise<MeasurementRecord> {
  return createMeasurementByParameter(aquariumId, 'phosphate', 'ppm', input, signal)
}

export async function deleteMeasurement(
  aquariumId: string,
  parameter: MeasurementParameter,
  measurementId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiDelete<unknown>(
    `/api/v1/aquariums/${aquariumId}/measurements/${parameter}/${measurementId}`,
    signal,
  )

  if (!isDeleteMeasurementResponse(response)) {
    throw new ApiRequestError('Received an unexpected measurement delete response shape from the API.', 502)
  }
}

async function listMeasurementsByParameter(
  aquariumId: string,
  parameter: MeasurementParameter,
  signal?: AbortSignal,
): Promise<MeasurementRecord[]> {
  const response = await apiGet<unknown>(
    `/api/v1/aquariums/${aquariumId}/measurements/${parameter}`,
    undefined,
    signal,
  )

  if (!isMeasurementListResponse(response)) {
    throw new ApiRequestError(`Received an unexpected ${parameter} measurement list response shape from the API.`, 502)
  }

  return response.data.map(toMeasurementRecord)
}

async function createMeasurementByParameter(
  aquariumId: string,
  parameter: MeasurementParameter,
  unit: MeasurementUnit,
  input: CreateMeasurementInput,
  signal?: AbortSignal,
): Promise<MeasurementRecord> {
  const response = await apiPost<unknown>(
    `/api/v1/aquariums/${aquariumId}/measurements/${parameter}`,
    {
      unit,
      value: input.value,
      measured_at: input.measuredAt,
    },
    signal,
  )

  if (!isMeasurementResponse(response)) {
    throw new ApiRequestError(`Received an unexpected ${parameter} measurement response shape from the API.`, 502)
  }

  return toMeasurementRecord(response.data)
}

function toMeasurementRecord(payload: MeasurementPayload): MeasurementRecord {
  const parameter = payload.parameter === 'phosphate' ? 'phosphate' : 'salinity'

  return {
    id: payload.id,
    aquariumId: payload.aquarium_id,
    parameter,
    value: payload.value,
    unit: payload.unit === 'ppm' ? 'ppm' : 'ppt',
    rawValue: payload.raw_value,
    rawUnit: payload.raw_unit,
    measuredAt: payload.measured_at,
    createdAt: payload.created_at,
  }
}

function isMeasurementPayload(input: unknown): input is MeasurementPayload {
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

function isMeasurementResponse(input: unknown): input is MeasurementResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.request_id === 'string' &&
    isMeasurementPayload(obj.data)
  )
}

function isMeasurementListResponse(input: unknown): input is MeasurementListResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>

  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string' || !Array.isArray(obj.data)) {
    return false
  }

  return obj.data.every((item) => isMeasurementPayload(item))
}

function isDeleteMeasurementResponse(input: unknown): input is DeleteMeasurementResponse {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>
  if (typeof obj.success !== 'boolean' || typeof obj.request_id !== 'string') return false
  if (typeof obj.data !== 'object' || obj.data === null) return false

  const data = obj.data as Record<string, unknown>
  return typeof data.id === 'string' && typeof data.deleted === 'boolean'
}
