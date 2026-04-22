export const INTELLIGENCE_DISPLAY_ORDER = [
  'Logical-Mathematical',
  'Linguistic',
  'Spatial',
  'Musical',
  'Interpersonal',
  'Intrapersonal',
  'Bodily-Kinesthetic',
  'Naturalistic',
];

export const INTELLIGENCE_LABELS = {
  'Logical-Mathematical': 'Logical',
  'Linguistic': 'Linguistic',
  'Spatial': 'Spatial',
  'Musical': 'Musical',
  'Interpersonal': 'Interpersonal',
  'Intrapersonal': 'Intrapersonal',
  'Bodily-Kinesthetic': 'Bodily-Kinesthetic',
  'Naturalistic': 'Naturalistic',
  'Existential': 'Existential',
};

export const INTELLIGENCE_COLORS = {
  'Logical-Mathematical': '#2563EB',
  'Linguistic': '#7C3AED',
  'Spatial': '#14B8A6',
  'Musical': '#EC4899',
  'Interpersonal': '#F59E0B',
  'Intrapersonal': '#0EA5E9',
  'Bodily-Kinesthetic': '#EF4444',
  'Naturalistic': '#22C55E',
  'Existential': '#64748B',
};

export function normalizeIntelligenceKey(name = '') {
  if (!name) return '';
  const normalized = String(name).trim().toLowerCase();

  if (normalized.includes('logical')) return 'Logical-Mathematical';
  if (normalized.includes('linguistic') || normalized.includes('verbal')) return 'Linguistic';
  if (normalized.includes('spatial') || normalized.includes('visual')) return 'Spatial';
  if (normalized.includes('musical')) return 'Musical';
  if (normalized.includes('interpersonal') || normalized.includes('social')) return 'Interpersonal';
  if (normalized.includes('intrapersonal') || normalized.includes('self')) return 'Intrapersonal';
  if (normalized.includes('bodily') || normalized.includes('kinesthetic')) return 'Bodily-Kinesthetic';
  if (normalized.includes('natural')) return 'Naturalistic';
  if (normalized.includes('existential')) return 'Existential';

  return name;
}
