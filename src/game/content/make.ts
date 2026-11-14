// Content constructors, shared by every region file.
import type { BattlerDef, EnemyDef, Fx, RegionId, Role, ShopDef, Tell, WalkInKind } from '../defs';

export const B = (id: string, name: string, role: Role, hp: number, dmg: number, interval: number, does: string, line: string, fx?: Fx): BattlerDef => ({ id, name, role, hp, dmg, interval, does, line, fx });
export const S = (id: string, name: string, battler: string, region: RegionId, zone: number, fight: number, lease: number, rent: number, tagline: string, kind: WalkInKind, who: string, reno = Math.max(5, lease * 0.25)): ShopDef => ({ id, name, battler, region, zone, fight, lease, reno, rent, tagline, walkin: { kind, who } });
export const BOSS = 99; // resolved to the lot's boss index in defs.ts
export const E = (name: string, title: string, hp: number, dmg: number, interval: number, weak: string, tell: Tell = null): EnemyDef => ({ name, title, hp, dmg, interval, weak, tell });
