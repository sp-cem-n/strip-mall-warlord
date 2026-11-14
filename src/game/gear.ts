import type { Gear, GearSlot, GameState } from './state';
import { pick, rand } from './rng';

const NAMES: Record<GearSlot, string[]> = {
  weapon: ['Aluminum Bat', 'Tire Iron', 'Maglite (4-cell)', 'Shift Knob', 'Rolled-Up Phone Book', 'Bike Lock on a Chain'],
  armor: ['Carhartt Jacket', 'Letterman Jacket', 'Motorcycle Vest', 'Hockey Pads', 'Security Guard Windbreaker', 'Insulated Coveralls'],
  kit: ['Rollerblades', 'Nextel Chirp Phone', 'Case of Red Bull', 'Pager', 'Fanny Pack (Full)', 'Discman w/ Anti-Skip'],
};
const GRADES = ['Beat-Up', 'Used', 'Decent', 'Like New', 'Still in Box'];
export const GEAR_SLOT_LABEL: Record<GearSlot, string> = { weapon: 'Weapon (+dmg)', armor: 'Outerwear (+HP)', kit: 'Kit (+speed)' };

export function rollGear(s: GameState, pawnLevel: number): Gear {
  const slot = pick(s, ['weapon', 'armor', 'kit'] as const);
  const g = Math.min(GRADES.length - 1, Math.floor(rand(s) * (1.5 + pawnLevel / 4)));
  const bonus = Math.round((0.05 + 0.04 * g + 0.015 * pawnLevel * rand(s)) * 100) / 100;
  return { slot, name: `${GRADES[g]} ${pick(s, NAMES[slot])}`, bonus };
}

export function gearBonus(s: GameState, slot: GearSlot): number {
  return s.gear[slot]?.bonus ?? 0;
}
