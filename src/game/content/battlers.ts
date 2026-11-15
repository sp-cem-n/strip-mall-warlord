// Everyone who can stand in a parking lot for you: shop hires, then the bosses who quit and join.
import { DAWN } from './dawn';
import type { BattlerDef, WalkInKind } from '../defs';
import { B } from './make';

export const BATTLER_LIST: BattlerDef[] = [
  B('fixer', 'Fixer', 'damage', 75, 14, 1.4, 'Steady all-rounder.', 'Knows a guy. The guy is also him.'),
  B('bouncer', 'Bouncer', 'tank', 130, 4, 1.4, 'Stands in front. Enemies hit the front first.', 'Has opinions about the line.'),
  B('medic', 'Medic', 'heal', 60, 15, 1.6, 'Heals whoever is worst off.', 'Quarters in every pocket.'),
  B('hustler', 'Hustler', 'damage', 50, 9, 1.0, 'Fast and fragile.', 'Hits first. Talks the whole time.'),
  B('watchman', 'Night Watchman', 'control', 70, 6, 1.4, 'Enemies take 15% more damage.', 'Writes everything down. Reads none of it.', { k: 'mark', v: 0.15 }),
  B('latefee', 'Late-Fee Collector', 'control', 60, 6, 1.5, 'Enemies attack 15% slower.', 'Be kind. Rewind. Pay the $3.', { k: 'slow', v: 0.15 }),
  B('lawyer', 'Lawyer', 'damage', 55, 26, 2.2, 'Slow, huge hits.', 'Paperwork beats paperwork.'),
  B('tokenkid', 'Token Kid', 'damage', 55, 8, 0.9, 'Quick little hits.', 'Has a roll of quarters in a sock.'),
  B('nailtech', 'Nail Tech', 'buffer', 45, 5, 1.2, 'Hustlers attack 20% faster.', 'Quick hands. Quicker opinions.', { k: 'haste', to: 'hustler', v: 0.2 }),
  B('tanning', 'Tanning Consultant', 'heal', 55, 6, 1.4, 'Tanks regain 1.5% HP a second.', 'Glows faintly in the dark.', { k: 'regen', v: 0.015 }),
  B('karaoke', 'Karaoke Host', 'buffer', 50, 5, 1.4, 'Damage dealers +10% damage.', 'Mic check. Fight check.', { k: 'dmgUp', to: 'damage', v: 0.1 }),
  B('notary', 'Notary', 'buffer', 50, 6, 1.6, 'Lawyers +25% damage.', 'Stamps it. Stamps you.', { k: 'dmgUp', to: 'lawyer', v: 0.25 }),
  B('driving', 'Driving Instructor', 'control', 80, 7, 1.6, 'Enemies deal 10% less damage.', 'Uses his own brake.', { k: 'weaken', v: 0.1 }),
  B('groomer', 'Groomer (and Dog)', 'damage', 60, 10, 1.3, 'Two hits a turn: hers and the dog\'s.', 'The dog does most of it.', { k: 'twin' }),
  B('copyguy', 'Copy Guy', 'buffer', 55, 5, 1.4, 'Copies the strongest other aura at 50%.', "It's not plagiarism if it's toner.", { k: 'copy', v: 0.5 }),
  B('hygienist', 'Hygienist', 'heal', 60, 40, 3.0, 'Big heal on the worst off, slowly.', 'This might pinch.'),
  B('mattress', 'Mattress Guy', 'tank', 260, 5, 2.0, 'The most HP on the lot.', 'Every day is a sale. Every sale is final.'),
  B('kiosk', 'Kiosk Pitchman', 'control', 55, 6, 1.2, '10% chance an enemy loses its turn.', 'Sir. Sir. Sir.', { k: 'stun', v: 0.1 }),
  B('trainer', 'Personal Trainer', 'buffer', 70, 7, 1.4, 'Tanks +20% HP.', 'One more rep. One more fight.', { k: 'hpUp', to: 'tank', v: 0.2 }),
  B('clown', 'Party Clown', 'control', 55, 6, 1.3, '10% of enemy hits land on another enemy.', 'His name is Doug.', { k: 'confuse', v: 0.1 }),
  // bosses who quit and join you
  B('supervisor', 'Night Shift Supervisor', 'buffer', 120, 8, 1.6, 'Whole crew attacks 5% faster.', 'Keeps everyone on schedule.', { k: 'haste', to: 'all', v: 0.05 }),
  B('lpmanager', 'District LP Manager', 'tank', 200, 9, 1.5, 'Takes 10% less damage.', 'Now oversees eleven stores and you.', { k: 'dr', v: 0.1 }),
  B('outletgm', 'Outlet Mall GM', 'buffer', 150, 10, 1.5, 'Whole crew +10% HP.', 'Brought the lanyard.', { k: 'hpUp', to: 'all', v: 0.1 }),
  B('buildingmgr', 'Building Manager', 'heal', 140, 20, 1.8, 'First ally down gets back up at 30% HP.', 'Fixes things. Eventually.', { k: 'revive', v: 0.3 }),
  B('regionalpm', 'Regional Property Manager', 'damage', 160, 30, 1.4, 'Heavy hitter.', 'Never been inside a dojo. Hits like he owns one.'),
  B('developer', 'The Developer', 'buffer', 180, 14, 1.4, '+10% Goodwill per win.', 'Here to "learn the business."', { k: 'payUp', v: 0.1 }),
  // The Bypass crew
  B('auction', 'Auction Hunter', 'damage', 70, 16, 1.6, 'Big hits. Bids on everything.', 'Paid $40 for a unit. Found a jet ski.'),
  B('detailer', 'Detailer', 'buffer', 60, 6, 1.2, 'Whole crew attacks 8% faster.', 'Hand-dried. Every time.', { k: 'haste', to: 'all', v: 0.08 }),
  B('nurse', 'Urgent Care Nurse', 'heal', 70, 18, 1.5, 'Heals whoever is worst off.', 'Seen worse. Today, even.'),
  B('bartender', 'Bartender', 'tank', 180, 6, 1.6, 'Takes 10% less damage.', 'Has heard it all. Hits back.', { k: 'dr', v: 0.1 }),
  B('bondsman', 'Bail Bondsman', 'tank', 220, 6, 1.6, 'Takes 15% less damage.', 'Always gets his money back.', { k: 'dr', v: 0.15 }),
  B('preparer', 'Tax Preparer', 'control', 65, 7, 1.5, 'Enemies deal 12% less damage.', 'Itemizes your injuries.', { k: 'weaken', v: 0.12 }),
  B('golfpro', 'Golf Pro', 'damage', 65, 18, 1.3, 'Fast, heavy swings.', 'Keep your head down. He will.'),
  B('planner', 'Wedding Planner', 'buffer', 55, 5, 1.4, 'Whole crew +8% damage.', 'Everyone has a job. Including you.', { k: 'dmgUp', to: 'all', v: 0.08 }),
  B('usher', 'Cineplex Usher', 'control', 60, 6, 1.3, 'Enemies take 12% more damage.', 'Flashlight in your eyes. On purpose.', { k: 'mark', v: 0.12 }),
  B('pretzel', 'Pretzel Stand Kid', 'heal', 50, 6, 1.4, 'Tanks regain 2% HP a second.', 'Free samples. Mandatory.', { k: 'regen', v: 0.02 }),
  B('leasingdir', 'Leasing Director', 'damage', 200, 30, 1.5, 'Heavy hitter.', 'Quit on a Friday. Left a voicemail.'),
  B('vp', 'VP of Real Estate Strategy', 'buffer', 210, 12, 1.5, 'Whole crew +10% damage.', 'Circles back. Hits on the way.', { k: 'dmgUp', to: 'all', v: 0.1 }),
  B('partner', 'Managing Partner', 'buffer', 260, 16, 1.5, 'Whole crew +15% HP.', 'Has a boat. Has opinions about your boat.', { k: 'hpUp', to: 'all', v: 0.15 }),
  B('chairman', 'The Chairman', 'buffer', 300, 20, 1.5, DAWN.chairman, 'Owns the mall. Rents the chair.', { k: 'payUp', v: 0.1 }),
];

export const WALKIN_NAMES: Record<WalkInKind, string[]> = {
  rally: ['a Tire Iron', 'a 4-Cell Flashlight', 'a Letterman Jacket', 'a Case of Energy Drinks', 'a CD Player w/ Anti-Skip', 'Inline Skates'],
  cash: ['Guy with 40 Virtual Pets', 'Bean-Bag Animal Reseller', 'Man Who Needs It by Friday', 'Woman with a Jet Ski Problem', 'A Sock with a $20 In It'],
  referral: ["Told his cousin about you", 'Left a five-star comment card', 'Mentioned you at church', 'Put your flyer on 30 windshields'],
};
