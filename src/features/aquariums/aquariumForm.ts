import { type AquariumRecord } from '../../api/aquariums'
import { type ApiRequestError } from '../../api/client'

export interface AquariumFormValues {
  name: string
  type: string
  volumeValue: number | ''
  volumeUnit: 'L' | 'gal_us'
}

export const AQUARIUM_TYPES = [
  'Saltwater Reef',
  'Saltwater FOWLR',
  'Freshwater Planted',
  'Freshwater Community',
]

export function defaultAquariumFormValues(): AquariumFormValues {
  return {
    name: '',
    type: AQUARIUM_TYPES[0],
    volumeValue: '',
    volumeUnit: 'L',
  }
}

export function validateAquariumForm(values: AquariumFormValues): Partial<Record<keyof AquariumFormValues, string>> {
  const errors: Partial<Record<keyof AquariumFormValues, string>> = {}

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required'
  }

  if (values.type.trim().length === 0) {
    errors.type = 'Type is required'
  }

  const volumeValue = Number(values.volumeValue)
  if (values.volumeValue === '' || Number.isNaN(volumeValue) || volumeValue <= 0) {
    errors.volumeValue = 'Volume must be greater than 0'
  }

  if (values.volumeUnit !== 'L' && values.volumeUnit !== 'gal_us') {
    errors.volumeUnit = 'Select a valid unit'
  }

  return errors
}

export function mapAquariumValidationErrors(
  error: ApiRequestError,
): Partial<Record<keyof AquariumFormValues, string>> {
  const errors: Partial<Record<keyof AquariumFormValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    const fieldKey = item.loc.join('.')
    if (fieldKey.endsWith('name')) {
      errors.name = item.msg
    }
    if (fieldKey.endsWith('type')) {
      errors.type = item.msg
    }
    if (fieldKey.endsWith('volume.value')) {
      errors.volumeValue = item.msg
    }
    if (fieldKey.endsWith('volume.unit')) {
      errors.volumeUnit = item.msg
    }
  }

  return errors
}

export function toAquariumFormValues(record: AquariumRecord): AquariumFormValues {
  return {
    name: record.name,
    type: record.type,
    volumeValue: Number(record.volumeLiters.toFixed(2)),
    volumeUnit: 'L',
  }
}

export function toAquariumUpdatePayload(values: AquariumFormValues) {
  return {
    name: values.name.trim(),
    type: values.type,
    volume: {
      value: Number(values.volumeValue),
      unit: values.volumeUnit,
    },
  }
}
