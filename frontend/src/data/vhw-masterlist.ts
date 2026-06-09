import type { VhwRecord } from '../types/vhw';
import vhwData from './vhw-masterlist.json';

// Properly typed VHW master list imported from JSON
// This eliminates the union type complexity by using a JSON import
export const vhwMasterList = vhwData as VhwRecord[];
