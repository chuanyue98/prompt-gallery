export const MODEL_OPTIONS = [
  'GPT-Image 2',
  'GPT-Image 1',
  'p-image',
  'Nano Banana Pro',
  'Seedance 2.0 Fast',
  'Seedance 2.0',
  'Midjourney',
  'Sora',
] as const;

const MODEL_ALIASES = new Map<string, string>([
  ['gptimage2', 'GPT-Image 2'],
  ['gtpimage2', 'GPT-Image 2'],
  ['gptimage1', 'GPT-Image 1'],
  ['nanobananopro', 'Nano Banana Pro'],
  ['nanobananapro', 'Nano Banana Pro'],
  ['seedance20fast', 'Seedance 2.0 Fast'],
  ['seedance20', 'Seedance 2.0'],
  ['midjourney', 'Midjourney'],
  ['sora', 'Sora'],
]);

function modelKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSingleModelName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  return MODEL_ALIASES.get(modelKey(trimmed)) ?? trimmed;
}

export function normalizeModelName(value: string) {
  return value
    .split('/')
    .map(normalizeSingleModelName)
    .filter(Boolean)
    .join(' / ');
}
