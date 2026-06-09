let _counter = 0

export function generateId(prefix = ''): string {
  // Prefer secure UUID when available
  try {
    // @ts-ignore - global crypto types may vary between environments
    if (typeof globalThis?.crypto === 'object' && typeof (globalThis as any).crypto.randomUUID === 'function') {
      // keep prefix for compatibility with existing ids like 'a', 'b', 'u', etc.
      return `${prefix}${(globalThis as any).crypto.randomUUID()}`
    }
  } catch {}

  // Fallback to a simple session-incrementing id (stable and deterministic during runtime)
  _counter = (_counter + 1) % Number.MAX_SAFE_INTEGER
  return `${prefix}${_counter}`
}

export default generateId
