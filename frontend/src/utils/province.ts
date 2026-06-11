import { PROVINCES, DISTRICTS } from '@/types';

function normalizeRaw(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/^\.+/, '') // remove leading dots
    .replace(/[\+\/:,()\-]+/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

export function canonicalizeProvince(raw?: string | null): string | null {
  if (!raw) return null;
  const n = normalizeRaw(raw);

  // Direct exact match
  for (const p of PROVINCES) {
    if (n === p) return p;
  }

  // Match by contained tokens (ignore spaces)
  const nNoSpace = n.replace(/\s+/g, '');
  for (const p of PROVINCES) {
    const pNoSpace = p.replace(/\s+/g, '');
    if (nNoSpace.includes(pNoSpace) || pNoSpace.includes(nNoSpace)) return p;
  }

  // Match by district name -> province
  for (const [prov, districts] of Object.entries(DISTRICTS)) {
    for (const d of districts) {
      if (normalizeRaw(d) === n) return prov;
      if (n.includes(normalizeRaw(d))) return prov;
    }
  }

  // Common shorthand mapping
  if (n.includes('MASH') && n.includes('CENT')) return 'MASHONALAND CENTRAL';
  if (n.includes('MASH') && n.includes('EAST')) return 'MASHONALAND EAST';
  if (n.includes('MASH') && n.includes('WEST')) return 'MASHONALAND WEST';
  if (n.includes('MATAB') && n.includes('NORTH')) return 'MATABELELAND NORTH';
  if (n.includes('MATAB') && n.includes('SOUTH')) return 'MATABELELAND SOUTH';

  // Last resort: try to find any province token inside
  for (const p of PROVINCES) {
    const tokens = p.split(' ');
    if (tokens.every(t => n.includes(t))) return p;
  }

  return null;
}

export function canonicalizeOrRaw(raw?: string | null): string {
  return canonicalizeProvince(raw) || (raw ? normalizeRaw(raw) : '');
}
