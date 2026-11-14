// All tunable numbers and content live here. docs/V05_DESIGN.md mirrors these; change both together.

export type Role = 'tank' | 'damage' | 'heal' | 'control' | 'buffer';
export const ROLES: Role[] = ['tank', 'damage', 'control', 'heal', 'buffer']; // front to back on the lot
export type RegionId = 0 | 1;
export type Target = 'all' | Role | string; // string = a battler id

// What a battler does besides hit or heal. Auras are set when a fight starts and last the fight.
export type Fx =
  | { k: 'mark'; v: number } // enemies take +v damage
  | { k: 'slow'; v: number } // enemies attack v slower
  | { k: 'weaken'; v: number } // enemies deal v less
  | { k: 'stun'; v: number } // chance an enemy loses its turn
  | { k: 'confuse'; v: number } // chance an enemy hits another enemy
  | { k: 'haste'; to: Target; v: number }
  | { k: 'dmgUp'; to: Target; v: number }
  | { k: 'hpUp'; to: Target; v: number }
  | { k: 'regen'; v: number } // tanks regain v of max HP per second
  | { k: 'revive'; v: number } // first ally down gets back up at v HP, once per fight
  | { k: 'twin' } // a second, smaller hit
  | { k: 'copy'; v: number } // copies the strongest other aura at v
  | { k: 'payUp'; v: number } // +v Goodwill / Equity per win
  | { k: 'dr'; v: number }; // takes v less damage

export interface BattlerDef {
  id: string;
  name: string;
  role: Role;
  hp: number;
  dmg: number; // heal amount for healers
  interval: number;
  fx?: Fx;
  does: string;
  line: string;
}

const B = (id: string, name: string, role: Role, hp: number, dmg: number, interval: number, does: string, line: string, fx?: Fx): BattlerDef => ({ id, name, role, hp, dmg, interval, does, line, fx });

export const BATTLERS: Record<string, BattlerDef> = Object.fromEntries(
  [
    B('fixer', 'Fixer', 'damage', 75, 14, 1.4, 'Steady all-rounder.', 'Knows a guy. The guy is also him.'),
    B('bouncer', 'Bouncer', 'tank', 130, 4, 1.4, 'Stands in front. Enemies hit the front first.', 'Has opinions about the line.'),
    B('medic', 'Medic', 'heal', 60, 15, 1.6, 'Heals whoever is worst off.', 'Quarters in every pocket.'),
    B('hustler', 'Hustler', 'damage', 50, 9, 1.0, 'Fast and fragile.', 'Hits first. Talks the whole time.'),
    B('watchman', 'Night Watchman', 'control', 70, 6, 1.4, 'Enemies take 15% more damage.', 'Writes everything down. Reads none of it.', { k: 'mark', v: 0.15 }),
    B('latefee', 'Late-Fee Collector', 'control', 60, 6, 1.5, 'Enemies attack 15% slower.', 'Be kind. Rewind. Pay the $3.', { k: 'slow', v: 0.15 }),
    B('lawyer', 'Lawyer', 'damage', 55, 26, 2.2, 'Slow, huge hits.', 'Paperwork beats paperwork.'),
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
    B('bondsman', 'Bail Bondsman', 'tank', 220, 6, 1.6, 'Takes 15% less damage.', 'Always gets his money back.', { k: 'dr', v: 0.15 }),
    B('preparer', 'Tax Preparer', 'control', 65, 7, 1.5, 'Enemies deal 12% less damage.', 'Itemizes your injuries.', { k: 'weaken', v: 0.12 }),
    B('golfpro', 'Golf Pro', 'damage', 65, 18, 1.3, 'Fast, heavy swings.', 'Keep your head down. He will.'),
    B('planner', 'Wedding Planner', 'buffer', 55, 5, 1.4, 'Whole crew +8% damage.', 'Everyone has a job. Including you.', { k: 'dmgUp', to: 'all', v: 0.08 }),
    B('usher', 'Cineplex Usher', 'control', 60, 6, 1.3, 'Enemies take 12% more damage.', 'Flashlight in your eyes. On purpose.', { k: 'mark', v: 0.12 }),
    B('pretzel', 'Pretzel Stand Kid', 'heal', 50, 6, 1.4, 'Tanks regain 2% HP a second.', 'Free samples. Mandatory.', { k: 'regen', v: 0.02 }),
    B('leasingdir', 'Leasing Director', 'damage', 200, 30, 1.5, 'Heavy hitter.', 'Quit on a Friday. Left a voicemail.'),
    B('vp', 'VP of Real Estate Strategy', 'buffer', 210, 12, 1.5, 'Whole crew +10% damage.', 'Circles back. Hits on the way.', { k: 'dmgUp', to: 'all', v: 0.1 }),
    B('partner', 'Managing Partner', 'buffer', 260, 16, 1.5, 'Whole crew +15% HP.', 'Has a boat. Has opinions about your boat.', { k: 'hpUp', to: 'all', v: 0.15 }),
    B('chairman', 'The Chairman', 'buffer', 300, 20, 1.5, '+10% Equity per win.', 'Owns the mall. Rents the chair.', { k: 'payUp', v: 0.1 }),
  ].map((b) => [b.id, b]),
);

export type WalkInKind = 'cash' | 'referral' | 'rally';
export interface ShopDef {
  id: string;
  name: string;
  battler: string;
  region: RegionId;
  zone: number; // lot that unlocks it
  fight: number; // fight index in that lot (== lot fights for the boss); -1 = you start with it
  lease: number; // Route 9: dollars. The Bypass: Equity.
  reno: number; // first renovation, in dollars
  rent: number; // $/s at level 1
  tagline: string;
  walkin: { kind: WalkInKind; who: string };
}
const S = (id: string, name: string, battler: string, region: RegionId, zone: number, fight: number, lease: number, rent: number, tagline: string, kind: WalkInKind, who: string, reno = Math.max(5, lease * 0.25)): ShopDef => ({ id, name, battler, region, zone, fight, lease, reno, rent, tagline, walkin: { kind, who } });
const BOSS = 99; // resolved to the lot's boss index below

export const SHOP_LIST: ShopDef[] = [
  S('pawn', 'Pawn Shop', 'fixer', 0, 0, -1, 0, 1, 'We buy gold. We sell gold. Mostly we hold gold.', 'rally', 'Wants to pawn'),
  S('dojo', 'Dojo', 'bouncer', 0, 0, 1, 15, 1.5, 'Karate, kickboxing, and a waiver nobody reads.', 'rally', 'Sparring partner'),
  S('laundromat', 'Laundromat', 'medic', 0, 0, 4, 120, 3, 'Twelve washers. Nine work.', 'cash', 'Found in a dryer'),
  S('vape', 'Vape Shop', 'hustler', 0, 0, 6, 600, 6, 'Open 24 hours, give or take.', 'cash', 'Reseller'),
  S('security', 'Security Office', 'watchman', 0, 0, BOSS, 2000, 0, "It doesn't make money. It makes sure.", 'referral', 'Retired cop'),
  S('video', 'Video Rental', 'latefee', 0, 1, 3, 5000, 20, 'Be kind. Rewind.', 'cash', 'Returning a tape'),
  S('payday', 'Payday Loans', 'lawyer', 0, 1, BOSS, 15000, 45, 'Cash today. Interest forever.', 'cash', 'Borrower'),
  S('nails', 'Nail Salon', 'nailtech', 0, 2, 2, 40000, 90, 'Walk-ins welcome. Opinions included.', 'referral', 'Regular'),
  S('tanning', 'Tanning Salon', 'tanning', 0, 2, 6, 90000, 160, 'A healthy glow. Medically, a glow.', 'rally', 'Bronzed guy'),
  S('karaoke', 'Karaoke Bar', 'karaoke', 0, 2, 10, 200000, 300, 'Two-drink minimum. One-song maximum.', 'rally', 'Wants the mic'),
  S('checks', 'Check Cashing', 'notary', 0, 2, BOSS, 450000, 550, "Two forms of ID. Three if you're nervous.", 'cash', 'Cashing a check'),
  S('driving', 'Driving School', 'driving', 0, 3, 3, 1e6, 1000, 'Hands at ten and two.', 'referral', 'Passed on the 4th try'),
  S('grooming', 'Pet Grooming', 'groomer', 0, 3, 7, 2.5e6, 1800, 'The dog is not for sale. Stop asking.', 'rally', 'Very good dog'),
  S('copy', 'Copy Center', 'copyguy', 0, 3, 11, 6e6, 3200, 'Collated, stapled, mildly warm.', 'referral', 'Needs 500 flyers'),
  S('dentist', 'Dentist', 'hygienist', 0, 3, BOSS, 1.4e7, 6000, 'Have you been flossing. (Not a question.)', 'cash', 'Paying cash'),
  S('mattress', 'Mattress Store', 'mattress', 0, 4, 3, 3e7, 11000, 'Going out of business since 1989.', 'cash', 'Just looking'),
  S('kiosk', 'Cell Phone Kiosk', 'kiosk', 0, 4, 7, 7e7, 20000, 'Can I ask you a question?', 'referral', 'Answered the question'),
  S('gym', 'Gym', 'trainer', 0, 4, 11, 1.6e8, 36000, 'No contract. (Contract.)', 'rally', 'Spotter'),
  S('party', 'Party Supply', 'clown', 0, 4, BOSS, 3.5e8, 65000, 'Balloons, plates, a clown named Doug.', 'cash', 'Needs 40 balloons'),
  // The Bypass: a new crew. New kinds of shops first, a few old ones trickle back in as franchises.
  S('storage', 'Self Storage', 'auction', 1, 0, -1, 0, 2, 'Climate controlled. Emotionally, not.', 'cash', 'Unit 114, behind on rent', 5),
  S('carwash', 'Car Wash', 'detailer', 1, 0, 2, 1, 3, 'The brushes have seen things.', 'rally', 'Wants the hot wax', 10),
  S('dojo2', 'Dojo (Exit 14)', 'bouncer', 1, 0, 5, 3, 6, 'Same waiver. Bigger parking lot.', 'rally', 'Sparring partner', 62),
  S('urgent', 'Urgent Care', 'nurse', 1, 0, 7, 8, 14, 'Walk-ins welcome. Wait: 3 hours.', 'referral', 'Got stitches, liked it', 300),
  S('security2', 'Security Office (Bypass)', 'watchman', 1, 0, BOSS, 15, 0, 'Same guy. Bigger monitors.', 'referral', 'Retired cop', 750),
  S('bail', 'Bail Bonds', 'bondsman', 1, 1, 2, 30, 30, 'Open 24 hours. Actually 24 hours.', 'referral', "Somebody's cousin", 1000),
  S('tax', 'Tax Prep', 'preparer', 1, 1, 9, 80, 90, 'Refunds in 24 hours (estimated).', 'cash', 'Wants a bigger refund', 8750),
  S('laundry2', 'Wash-n-Fold', 'medic', 1, 1, BOSS, 200, 160, 'Laundromat, but with a mission statement.', 'cash', 'Found in a dryer', 22500),
  S('golf', 'Golf Superstore', 'golfpro', 1, 2, 3, 500, 330, 'Try before you buy. In the net.', 'rally', 'Practicing his swing', 62500),
  S('payday2', 'Payday Loans (Bypass)', 'lawyer', 1, 2, 7, 1200, 600, 'Cash today. Same interest.', 'cash', 'Borrower', 162500),
  S('bridal', 'Bridal Boutique', 'planner', 1, 2, 10, 3000, 1100, 'Say yes to the dress. Say yes.', 'referral', 'Mother of the bride', 400000),
  S('party2', 'Party Supply (Bypass)', 'clown', 1, 2, BOSS, 7000, 2000, "Doug's brother, also Doug.", 'cash', 'Needs 40 balloons', 1000000),
  S('cineplex', 'Cineplex', 'usher', 1, 3, 3, 16000, 3800, 'Twelve screens. One is always broken.', 'rally', 'Snuck in', 2500000),
  S('grooming2', 'Pet Grooming (Bypass)', 'groomer', 1, 3, 7, 35000, 7000, 'Same dog. He drove.', 'rally', 'Very good dog', 6250000),
  S('pretzel', 'Pretzel Stand', 'pretzel', 1, 3, 11, 80000, 13000, 'The smell is the advertising.', 'cash', 'Wants the cinnamon one', 15000000),
];

export type Tell = 'tanky' | 'hard' | null; // tanky: +40% HP, -20% dmg. hard: +30% dmg, -20% HP.
export interface EnemyDef {
  name: string;
  tell: Tell;
  title: string;
  hp: number;
  dmg: number;
  interval: number;
  weak: string; // battler id; +25% from them
}
export interface LotDef {
  id: string;
  name: string;
  short: string;
  blurb: string;
  fights: number; // regular fights; the boss comes after
  killBase: number; // wins needed at fight 1; ramps per fight
  regulars: EnemyDef[];
  boss: EnemyDef & { joins: string };
  clearText: string;
}
const E = (name: string, title: string, hp: number, dmg: number, interval: number, weak: string, tell: Tell = null): EnemyDef => ({ name, title, hp, dmg, interval, weak, tell });

export interface RegionDef {
  id: RegionId;
  name: string;
  currency: 'Goodwill' | 'Equity';
  start: string; // shop you start with
  security: string; // shop whose level covers auto-advance
  lots: LotDef[];
  ending: string;
}

export const REGIONS: RegionDef[] = [
  {
    id: 0,
    name: 'Route 9',
    currency: 'Goodwill',
    start: 'pawn',
    security: 'security',
    ending: 'The rendering is now a parking lot. Yours.',
    lots: [
      { id: 'lot', name: 'The Parking Lot', short: 'Lot', blurb: 'Faded lines, one working lamp post, a shopping cart nobody owns.', fights: 8, killBase: 12,
        regulars: [E('Rent-a-Cop', 'Contract Security, Part-Time', 40, 4, 1.6, 'fixer'), E('Lot Attendant', 'Parking Enforcement Associate I', 30, 5, 1.4, 'hustler'), E('Cart Wrangler', 'Brings them back. Mostly.', 55, 4, 1.8, 'bouncer')],
        boss: { ...E('Night Shift Supervisor', 'Has a clipboard. Uses it.', 200, 8, 1.6, 'hustler'), joins: 'supervisor' },
        clearText: 'The Night Shift Supervisor clocked out for good. He asked if you have a dental plan.' },
      { id: 'bigbox', name: 'Big-Box Plaza', short: 'Big-Box', blurb: 'A Circuit Barn husk and a grocery that keeps changing names.', fights: 10, killBase: 20,
        regulars: [E('Loss Prevention Associate', 'Watches the monitors. Sometimes leaves the room.', 45, 5, 1.5, 'fixer'), E('Greeter', 'Says hello. Means it as a threat.', 60, 4, 1.6, 'bouncer', 'tanky'), E('Rent-a-Cop (Senior)', 'Full-Time w/ Dental', 60, 4, 1.6, 'hustler')],
        boss: { ...E('District Loss Prevention Manager', 'Oversees eleven stores and a golf cart.', 260, 9, 1.5, 'fixer', 'tanky'), joins: 'lpmanager' },
        clearText: 'The District LP Manager handed in his golf cart keys and asked where to stand.' },
      { id: 'outlet', name: 'Outlet Mall', short: 'Outlet', blurb: 'Seventy percent off, permanently. The fountain is off to save water.', fights: 12, killBase: 30,
        regulars: [E('Code Enforcement Officer', 'Municipal Code §14-210, Signage', 55, 5, 1.5, 'lawyer'), E('HOA President', 'Unpaid. Very motivated.', 45, 7, 1.7, 'lawyer', 'hard'), E('Mall Walker', 'Laps at 6 a.m. Elbows out.', 50, 6, 1.2, 'hustler')],
        boss: { ...E('Outlet Mall General Manager', 'Has a lanyard with four keycards.', 320, 10, 1.5, 'fixer', 'hard'), joins: 'outletgm' },
        clearText: 'The Outlet Mall GM kept the lanyard. Nobody asked him to give it back.' },
      { id: 'office', name: 'Sunrise Office Park', short: 'Office', blurb: 'Dentists, a notary, and a lobby fern that is somehow fine.', fights: 14, killBase: 40,
        regulars: [E('Badge-Reader Guard', 'Your badge is not in the system.', 60, 6, 1.4, 'hustler'), E('Parking Validator', 'One stamp. Never two.', 50, 8, 1.7, 'lawyer', 'hard'), E('Facilities Guy', 'Afraid of dogs. Says he isn\'t.', 70, 6, 1.6, 'groomer', 'tanky')],
        boss: { ...E('Building Manager', 'Has a key to every door but the right one.', 380, 11, 1.5, 'lawyer', 'tanky'), joins: 'buildingmgr' },
        clearText: 'The Building Manager said he could fix your door. He has not fixed your door.' },
      { id: 'lifestyle', name: 'Lifestyle Center', short: 'Lifestyle', blurb: 'Open-air. Fake brick. A cheesecake restaurant with a two-hour wait.', fights: 16, killBase: 50,
        regulars: [E('Developer Private Security', 'Paid by the developer. Paid well.', 65, 6, 1.4, 'hustler'), E('Placemaking Consultant', 'Explains the vision. Also hits people.', 50, 7, 1.6, 'fixer', 'hard'), E('Valet', 'Has your keys. Will not say where.', 60, 7, 1.3, 'bouncer', 'tanky')],
        boss: { ...E('Regional Property Manager', 'Oversees "the portfolio."', 420, 12, 1.4, 'lawyer', 'hard'), joins: 'regionalpm' },
        clearText: 'The Regional Property Manager updated his LinkedIn. It says "Pinewood Plaza."' },
      { id: 'commons', name: 'Pinewood Commons', short: 'Commons', blurb: 'COMING SOON. A sales trailer, a rendering, and a lot of surveyor flags.', fights: 18, killBase: 60,
        regulars: [E('Leasing Agent', 'Has a brochure for a place that does not exist.', 60, 8, 1.5, 'lawyer', 'hard'), E('Survey Crew', 'Cannot see past the Mattress Guy.', 80, 7, 1.7, 'mattress'), E('Bulldozer Operator', 'Engine running. Always.', 90, 9, 1.8, 'bouncer', 'tanky')],
        boss: { ...E('The Developer', 'Owns the rendering. Wants the plaza.', 600, 14, 1.4, 'regionalpm', 'tanky'), joins: 'developer' },
        clearText: 'The Developer folded up the rendering and asked if you were hiring.' },
    ],
  },
  {
    id: 1,
    name: 'The Bypass',
    currency: 'Equity',
    start: 'storage',
    security: 'security2',
    ending: 'The Bypass is yours. Route 9 North is still being surveyed.',
    lots: [
      { id: 'power', name: 'Exit 14 Power Center', short: 'Exit 14', blurb: 'Six big boxes, one parking lot, no trees. Opened 1998.', fights: 10, killBase: 25,
        regulars: [E('Power Center Security', 'Golf cart with a siren.', 45, 5, 1.4, 'auction'), E('Inventory Specialist', 'Counts things. Counts you.', 40, 6, 1.5, 'auction', 'hard'), E('Sweeper Truck Driver', 'Out at 3 a.m. Every night.', 70, 4, 1.8, 'bouncer', 'tanky')],
        boss: { ...E('Leasing Director', 'Fourteen anchor tenants and no patience.', 260, 9, 1.5, 'auction', 'hard'), joins: 'leasingdir' },
        clearText: 'The Leasing Director quit on a Friday. He left a voicemail.' },
      { id: 'campus', name: 'Corporate Campus', short: 'Campus', blurb: 'Mirrored glass. A pond with a fountain that is on, aggressively.', fights: 12, killBase: 35,
        regulars: [E('Campus Security', 'Patrols the pond. Talks to the geese.', 55, 6, 1.4, 'bouncer'), E('Synergy Consultant', 'Here to align.', 45, 8, 1.6, 'auction', 'hard'), E('Shuttle Driver', 'Every 12 minutes. Never yours.', 75, 5, 1.7, 'bondsman', 'tanky')],
        boss: { ...E('VP of Real Estate Strategy', 'Circles back.', 340, 10, 1.5, 'auction', 'tanky'), joins: 'vp' },
        clearText: 'The VP of Real Estate Strategy circled back. To you.' },
      { id: 'towncenter', name: 'Town Center, Phase II', short: 'Phase II', blurb: 'Cranes, a model unit, and a banner that says LIVE WORK PLAY.', fights: 14, killBase: 45,
        regulars: [E('Construction Flagger', 'SLOW. On both sides.', 70, 6, 1.6, 'golfpro', 'tanky'), E('Brand Ambassador', 'Free tote bag. Not free.', 45, 8, 1.3, 'golfpro', 'hard'), E('Render Artist', 'Draws people who are happier than you.', 50, 7, 1.5, 'lawyer')],
        boss: { ...E('Managing Partner', 'Has a boat.', 420, 12, 1.5, 'lawyer', 'hard'), joins: 'partner' },
        clearText: 'The Managing Partner sold the boat. He says it was his idea.' },
      { id: 'galleria', name: 'Bypass Galleria', short: 'Galleria', blurb: 'Two levels, a glass elevator, and a carousel nobody is allowed to ride.', fights: 16, killBase: 55,
        regulars: [E('Mall Cop (Segway)', 'Top speed: 12 mph. Uses all of it.', 55, 7, 1.3, 'golfpro', 'hard'), E('Kiosk Manager', 'Runs six kiosks. Remembers your face.', 60, 7, 1.5, 'lawyer'), E('Escalator Tech', 'Out of order. Always.', 85, 6, 1.7, 'groomer', 'tanky')],
        boss: { ...E('The Chairman', 'Owns the mall. And the chair.', 520, 14, 1.4, 'lawyer', 'tanky'), joins: 'chairman' },
        clearText: 'The Chairman signed the Galleria over on a napkin. He kept the napkin.' },
    ],
  },
];

// resolve boss unlocks
for (const sh of SHOP_LIST) if (sh.fight === BOSS) sh.fight = REGIONS[sh.region].lots[sh.zone].fights;
export const SHOPS: Record<string, ShopDef> = Object.fromEntries(SHOP_LIST.map((s) => [s.id, s]));

// ---- pacing knobs ----
const env = (k: string, d: number) => Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k] ?? d);
export const START_CASH = 10;
const KILL_SCALE = env('SMW_K', 1);
export const KILL_RAMP = 1.1; // wins needed grows 10% per fight inside a lot
export const FIGHT_GROWTH = [env('SMW_G0', 1.066), env('SMW_G1', 1.12)] as const; // enemy HP and damage per fight, across a region
export const LOT_JUMP = [env('SMW_J0', 1.3), env('SMW_J1', 1.5)] as const; // extra step at each new lot
export const REGION_START = [1, env('SMW_S1', 1)] as const;
export const PAY_BASE = [2, 0.2] as const; // Goodwill / Equity per win at a region's first fight. Bypass wins pay thin: most Equity comes from the bank.
export const PAY_GROWTH = [1.06, env('SMW_P1', 1.09)] as const; // per fight, across the region
export const BOSS_PAY = 25; // a boss win pays this many wins' worth
export const WEAK_BONUS = 0.25;
export const RENO_GROWTH = 1.35;
export const RENT_GROWTH = 1.15;
export const STAT_GROWTH = 1.1;
export const TRAIN_STEP = 0.05; // per Goodwill track level
export const TRAIN_BASE = [20, 2] as const; // Goodwill (Route 9) / Equity (Bypass)
export const TRAIN_GROWTH = 1.3;
export const GOODWILL_PER_EQUITY = env('SMW_R', 10); // conversion: Goodwill buys Equity, one way
export const ASPHALT_BONUS = env('SMW_A', 0.02); // per asphalt: Route 9 rent, stats and Goodwill
export const SECURITY_LEVELS = (zone: number) => 1 + 5 * (zone - 1); // Security Office level that covers a lot (lot 1 is free)
export const STANCE = { even: { hp: 1, dmg: 1 }, rush: { hp: 0.8, dmg: 1.3 }, dig: { hp: 1.3, dmg: 0.8 } } as const;
export type Stance = keyof typeof STANCE;
export const TELL = { tanky: { hp: 1.4, dmg: 0.8 }, hard: { hp: 0.8, dmg: 1.3 } } as const;
export const OVERTIME_SECONDS = 120; // costs this many seconds of the region's rent
export const OVERTIME_FIGHTS = 3;
export const OVERTIME_BOOST = 0.25; // +HP and +damage
export const RETRY_AFTER = 10; // farmed wins before auto-advance tries the frontier again
export const FALL_BACK_AFTER = 3;
export const REGROUP_SECONDS = 1.5;
export const FIGHT_TIMEOUT = 30;
export const WALKIN_EVERY = 90;
export const WALKIN_STAYS = 25;
export const RALLY_SECONDS = 30;
export const RALLY_BOOST = 0.25;
export const TIP_SECONDS = 30; // cash walk-in: this much rent
export const REFERRAL_WINS = 10; // referral walk-in: this many wins' pay
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const STEP = 0.2;
export const WALKIN_NAMES: Record<WalkInKind, string[]> = {
  rally: ['a Tire Iron', 'a 4-Cell Flashlight', 'a Letterman Jacket', 'a Case of Energy Drinks', 'a CD Player w/ Anti-Skip', 'Inline Skates'],
  cash: ['Guy with 40 Virtual Pets', 'Bean-Bag Animal Reseller', 'Man Who Needs It by Friday', 'Woman with a Jet Ski Problem', 'A Sock with a $20 In It'],
  referral: ["Told his cousin about you", 'Left a five-star comment card', 'Mentioned you at church', 'Put your flyer on 30 windshields'],
};

// ---- the fight ladder: every region flattened into one list ----
export interface FightDef {
  region: RegionId;
  zone: number;
  i: number; // index inside the lot; i === lot.fights is the boss
  boss: boolean;
  need: number;
  pay: number;
  strength: number;
}
export const FIGHTS: FightDef[][] = REGIONS.map((r) => {
  const out: FightDef[] = [];
  let str = REGION_START[r.id] / FIGHT_GROWTH[r.id];
  r.lots.forEach((lot, zone) => {
    if (zone) str *= LOT_JUMP[r.id];
    for (let i = 0; i <= lot.fights; i++) {
      str *= FIGHT_GROWTH[r.id];
      const boss = i === lot.fights;
      const g = out.length;
      const per = PAY_BASE[r.id] * PAY_GROWTH[r.id] ** g;
      out.push({ region: r.id, zone, i, boss, need: boss ? 1 : Math.round(lot.killBase * KILL_SCALE * KILL_RAMP ** i), pay: Math.max(1, Math.round(boss ? per * BOSS_PAY : per)), strength: str });
    }
  });
  return out;
});
export const fightIndex = (region: RegionId, zone: number, i: number) => FIGHTS[region].findIndex((f) => f.zone === zone && f.i === i);
