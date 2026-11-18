// Content constructors, shared by every region file.
import type { BattlerDef, EnemyDef, Fx, RegionId, Role, ShopDef, Tell, WalkIn } from '../defs';

export const B = (id: string, name: string, role: Role, hp: number, dmg: number, interval: number, does: string, line: string, fx?: Fx): BattlerDef => ({ id, name, role, hp, dmg, interval, does, line, fx });
export const S = (id: string, name: string, battler: string, region: RegionId, zone: number, fight: number, lease: number, rent: number, tagline: string, walkins: WalkIn[], reno = Math.max(5, lease * 0.25)): ShopDef => ({ id, name, battler, region, zone, fight, lease, reno, rent, tagline, walkins });
// Walk-ins, one per line: 'R ...' rallies the crew, 'G ...' pays a little Goodwill (Equity on the Bypass), 'T ...' is a chance at a ticket (a rumor slip on the Bypass).
const KIND = { R: 'rally', G: 'pay', T: 'ticket' } as const;
export const W = (...lines: string[]): WalkIn[] => lines.map((l) => ({ kind: KIND[l[0] as keyof typeof KIND], who: l.slice(2) }));
export const BOSS = 99; // resolved to the lot's boss index in defs.ts
export const E = (name: string, title: string, hp: number, dmg: number, interval: number, weak: string, tell: Tell = null): EnemyDef => ({ name, title, hp, dmg, interval, weak, tell });
