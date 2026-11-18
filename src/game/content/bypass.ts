// The Route 9 Bypass: a new crew. New kinds of shops first, a few old ones trickle back in as franchises.
import type { RegionDef, ShopDef } from '../defs';
import { B, BOSS, E, S, W } from './make';
import { MGMT_RENO } from '../knobs';

// The 21st Pinewood unit: the office the receipt was always printed for. After dawn only, leased in Equity.
export const MGMT: ShopDef = { ...S('mgmt', 'Plaza Management', 'sal', 0, 0, -1, 40, 0, 'Pinewood Plaza Mgmt. Office hours by appointment. Nobody has an appointment.', W(), MGMT_RENO), dawn: true };
export const SAL = B('sal', 'Uncle Sal', 'damage', 320, 48, 1.8, 'Fights at your best shop\'s level. Every renovation: +3% rent on both roads.', 'Came back from Boca. Says the lot looks smaller.');

export const BYPASS_SHOPS: ShopDef[] = [
  S('storage', 'Self Storage', 'auction', 1, 0, -1, 0, 2, 'Climate controlled. Emotionally, not.', W('G Unit 114 pays up', 'T Auction find'), 5),
  S('carwash', 'Car Wash', 'detailer', 1, 0, 2, 1, 3, 'The brushes have seen things.', W('R Wants the hot wax', 'G A fleet of six vans'), 8),
  S('offramp', 'The Off-Ramp', 'bartender', 1, 0, 4, 2, 4, 'Cash only. Darts, pool, and a poker machine by the bathrooms.', W('T Regular, wants his stool back', 'G Darts league night'), 15),
  S('dojo2', 'Dojo (Exit 14)', 'bouncer', 1, 1, 1, 3, 7, 'Same waiver. Bigger parking lot.', W('R Sparring partner', 'G Belt test day'), 75),
  S('urgent', 'Urgent Care', 'nurse', 1, 1, 4, 7, 13, 'Walk-ins welcome. Wait: 3 hours.', W('G Got stitches, liked it', 'R Sprained ankle, wants back in'), 250),
  S('security2', 'Security Office (Bypass)', 'watchman', 1, 1, BOSS, 13, 0, 'Same guy. Bigger monitors.', W(), 600),
  S('temp', 'Temp-Rite Staffing', 'temp', 1, 2, 2, 20, 24, 'Here through Friday. Possibly forever.', W('G Needs a receptionist by Monday', 'R Data-entry temp, 90 wpm', 'T Free coffee mug'), 800),
  S('daycare', 'Little Achievers Day Care', 'daycare', 1, 2, 5, 27, 30, "Pickup by 6. After 6, it's a dollar a minute.", W('G Late pickup, paid the fee', 'R Field-trip chaperone', 'T Lost-and-found mitten'), 1000),
  S('tax', 'Tax Prep', 'preparer', 1, 2, 8, 35, 36, 'Refunds in 24 hours (estimated).', W('G Wants a bigger refund', 'T Shoebox of receipts'), 1400),
  S('bail', 'Bail Bonds', 'bondsman', 1, 3, 2, 50, 55, 'Open 24 hours. Actually 24 hours.', W("G Somebody's cousin", 'R Skipped bail, came back'), 3200),
  S('payday2', 'Payday Loans (Bypass)', 'lawyer', 1, 3, 6, 70, 75, 'Cash today. Same interest.', W('G Borrower', 'R Collections guy'), 6000),
  S('golf', 'Golf Superstore', 'golfpro', 1, 4, 3, 200, 160, 'Try before you buy. In the net.', W('R Practicing his swing', 'G Corporate outing'), 22500),
  S('grooming2', 'Pet Grooming (Bypass)', 'groomer', 1, 4, 7, 330, 240, 'Same dog. He drove.', W('R Very good dog (he drove)', 'G Show poodle'), 40000),
  S('espresso', 'Daily Grind Espresso', 'barista', 1, 5, 3, 830, 470, 'Tall, grande, or a coffee.', W('R Triple-shot regular', 'G Book club of eight', 'T Punch card, tenth one free'), 110000),
  S('bridal', 'Bridal Boutique', 'planner', 1, 5, 8, 1600, 730, 'Something borrowed. Everything financed.', W('G Mother of the bride', 'R Bride on a deadline'), 220000),
  S('party2', 'Party Supply (Bypass)', 'clown', 1, 6, 3, 4200, 1400, "Doug's brother, also Doug.", W("G Doug's brother's party", 'T Leftover confetti'), 580000),
  S('laundry2', 'Wash-n-Fold', 'medic', 1, 6, 8, 7400, 2100, 'Laundromat, but with a mission statement.', W('T Found in a dryer', 'G Drop-off, 40 pounds'), 1050000),
  S('cineplex', 'Cineplex', 'usher', 1, 7, 3, 17500, 4000, 'Twelve screens. One is always broken.', W('R Snuck in', 'G Midnight premiere line'), 2750000),
  S('pretzel', 'Pretzel Stand', 'pretzel', 1, 7, 8, 29000, 6000, 'The smell is the advertising.', W('G Wants the cinnamon one', 'T Free-sample guy'), 5000000),
  S('portraits', 'Glamor Snaps Portraits', 'photographer', 1, 8, 4, 76000, 12500, 'Soft focus. Hard sell.', W('G Family portrait, matching sweaters', 'R Wants the feather-boa shot', 'T Free 8x10 coupon'), 14000000),
  S('disc', 'Disc Depot', 'recordclerk', 1, 8, 9, 130000, 19000, 'Listening stations in back. Headphones mostly work.', W('R Wants the new Spice Girls CD', 'G Midnight release line', 'T Listening-station regular'), 25000000),
];

// Each lot's skyline words (the art is in art/field.ts): the lit sign, the tube indexes that are out, and the joke prop's words.
export const BYPASS_SKY = {
  power: { sign: 'EXIT 14', out: [] as number[] },
  frontage: { sign: 'VACANCY', out: [], board: 'INJURED? CALL 1-800-' },
  campus: { sign: 'SYNERGEX', out: [3] },
  county: { sign: '88', bank: 'FIRST COUNTY' },
  fairway: { sign: 'FAIRWAY POINTE', out: [], sub: 'HOMES FROM THE LOW $190S' },
  towncenter: { sign: 'LIVE WORK PLAY', out: [10, 11, 12, 13] },
  bargain: { sign: 'EVERYTHING MUST GO', out: [], ghost: 'VALU-MART' },
  crossroads: { sign: 'CROSSROADS 16', out: [], marquee: 'NOW SHOWING MEN IN BLAK' },
  galleria: { sign: 'GALLERIA', out: [5] },
};

export const BYPASS: RegionDef = {
  id: 1,
  name: 'The Bypass',
  pay: 'equity',
  leaseIn: 'equity',
  trainIn: 'equity',
  chrome: { plaza: 'Exit 14, Rt. 9 Bypass', mgmt: 'EXIT 14 MGMT' },
  start: 'storage',
  ending: 'The Bypass is yours. Every lot, both exits, and the Chairman\'s good chair.',
  lots: [
    { id: 'power', name: 'Exit 14 Power Center', short: 'Exit 14', blurb: 'Six big boxes, one parking lot, no trees. Grand opening all month.', fights: 8,
      regulars: [E('Power Center Security', 'Golf cart with a siren.', 45, 5, 1.4, 'auction'), E('Inventory Specialist', 'Counts things. Counts you.', 40, 6, 1.5, 'auction', 'hard'), E('Sweeper Truck Driver', 'Out at 3 a.m. Every night.', 70, 4, 1.8, 'bouncer', 'tanky')],
      boss: { ...E('Leasing Director', 'Fourteen anchor tenants and no patience.', 260, 9, 1.5, 'auction', 'hard'), joins: 'leasingdir' },
      clearText: 'The Leasing Director quit on a Friday. He left a voicemail.' },
    { id: 'frontage', name: 'Frontage Road', short: 'Frontage', blurb: 'A motel, a tow yard, and a billboard for a lawyer who answers 24 hours.', fights: 9,
      regulars: [E('Motel Night Clerk', 'Bulletproof glass. Talks through the slot.', 45, 7, 1.5, 'bouncer', 'hard'), E('Tow Truck Driver', 'Hooked your car. Hooks you next.', 55, 8, 1.7, 'auction', 'hard'), E('Billboard Installer', 'INJURED? He will be.', 60, 6, 1.6, 'auction')],
      boss: { ...E('The Franchisee', 'Owns six of everything on this road.', 300, 9, 1.5, 'auction', 'tanky'), joins: 'franchisee' },
      clearText: 'The Franchisee sold you the franchise. All six.' },
    { id: 'campus', name: 'Corporate Campus', short: 'Campus', blurb: 'Mirrored glass. A pond with a fountain that is on, aggressively.', fights: 10,
      regulars: [E('Campus Security', 'Patrols the pond. Talks to the geese.', 55, 6, 1.4, 'bouncer'), E('Synergy Consultant', 'Here to align.', 45, 8, 1.6, 'auction', 'hard'), E('Shuttle Driver', 'Every 12 minutes. Never yours.', 75, 5, 1.7, 'bondsman', 'tanky')],
      boss: { ...E('VP of Real Estate Strategy', 'Circles back.', 340, 10, 1.5, 'auction', 'tanky'), joins: 'vp' },
      clearText: 'The VP of Real Estate Strategy circled back. To you.' },
    { id: 'county', name: 'County Center Drive', short: 'County', blurb: 'The courthouse annex, a DMV, and a bank clock stuck on 88 degrees.', fights: 10,
      regulars: [E('Zoning Clerk', 'Variance denied. Variance pending.', 75, 5, 1.7, 'lawyer', 'tanky'), E('Process Server', 'You have been served. Again.', 70, 6, 1.6, 'leasingdir', 'tanky'), E('DMV Line Monitor', 'Take a number. Not that one.', 80, 5, 1.8, 'lawyer', 'tanky')],
      boss: { ...E('County Commissioner', 'Votes on the zoning. Votes on you.', 360, 10, 1.5, 'lawyer', 'tanky'), joins: 'commissioner' },
      clearText: 'The County Commissioner rezoned himself onto your side. Unanimous.' },
    { id: 'fairway', name: 'Fairway Pointe', short: 'Fairway', blurb: 'Model homes from the low $190s, a clubhouse, and a sales trailer with one window out.', fights: 11,
      regulars: [E('Golf Cart Ranger', 'Keep it moving. He means you.', 50, 8, 1.4, 'golfpro', 'hard'), E('Groundskeeper', 'Mows at dawn. Mows at you.', 55, 8, 1.5, 'preparer', 'hard'), E('Review Committee', 'Your mailbox is the wrong beige.', 50, 9, 1.6, 'golfpro', 'hard')],
      boss: { ...E('The Club Treasurer', 'Audits your swing. Then drives the cart through it.', 380, 11, 1.5, 'golfpro', 'hard'), joins: 'treasurer' },
      clearText: 'The Club Treasurer comped your membership. Dues start Monday.' },
    { id: 'towncenter', name: 'Town Center, Phase II', short: 'Phase II', blurb: 'Cranes, a model unit, and a banner that says LIVE WORK PLAY.', fights: 11,
      regulars: [E('Construction Flagger', 'SLOW. On both sides.', 70, 6, 1.6, 'golfpro', 'tanky'), E('Timeshare Rep', 'Free weekend in Orlando. Not free.', 45, 8, 1.3, 'golfpro', 'hard'), E('Render Artist', 'Draws people who are happier than you.', 50, 7, 1.5, 'lawyer')],
      boss: { ...E('Managing Partner', 'Has a boat.', 420, 12, 1.5, 'lawyer', 'tanky'), joins: 'partner' },
      clearText: 'The Managing Partner sold the boat. He says it was his idea.' },
    { id: 'bargain', name: 'Bargain Square', short: 'Bargain', blurb: 'A dead Valu-Mart, a dollar store, and a banner that has said EVERYTHING MUST GO since spring.', fights: 12,
      regulars: [E('Liquidation Crew', 'Tags everything. Including your car.', 80, 6, 1.7, 'lawyer', 'tanky'), E('Clearance Shopper', 'Has a cart. Has elbows.', 75, 7, 1.6, 'golfpro', 'tanky'), E('Mall Santa (July)', 'Off season. Still in the suit.', 85, 6, 1.8, 'planner', 'tanky')],
      boss: { ...E('The Liquidation Manager', 'Everything must go. Including you.', 440, 14, 1.4, 'lawyer', 'hard'), joins: 'liquidator' },
      clearText: 'The Liquidation Manager marked himself down. Final sale.' },
    { id: 'crossroads', name: 'Crossroads 16', short: 'Movies', blurb: 'Sixteen screens, stadium seating, and a searchlight for no reason.', fights: 12,
      regulars: [E('Ticket Taker', 'Tears it in half. Then you.', 75, 7, 1.5, 'auction', 'tanky'), E('Popcorn Supervisor', 'Butter is a topping. He is the butter.', 80, 6, 1.6, 'lawyer', 'tanky'), E('Line Wrangler', 'Laminated vest. Velvet rope. No mercy.', 85, 6, 1.7, 'usher', 'tanky')],
      boss: { ...E('The Megaplex GM', 'Opening night. He brought the whole line.', 480, 12, 1.4, 'usher', 'tanky'), joins: 'megaplexgm' },
      clearText: 'The Megaplex GM gave you the keys and a lifetime pass. Matinees only.' },
    { id: 'galleria', name: 'Bypass Galleria', short: 'Galleria', blurb: 'Two levels, a glass elevator, and a carousel nobody is allowed to ride.', fights: 14,
      regulars: [E('Mall Cop (Golf Cart)', 'Top speed: 12 mph. Uses all of it.', 55, 7, 1.3, 'photographer', 'hard'), E('Kiosk Manager', 'Runs six kiosks. Remembers your face.', 60, 7, 1.5, 'recordclerk'), E('Escalator Tech', 'Out of order. Always.', 85, 6, 1.7, 'groomer', 'tanky')],
      boss: { ...E('The Chairman', 'Owns the mall. And the chair.', 520, 14, 1.4, 'lawyer', 'tanky'), joins: 'chairman' },
      clearText: 'The Chairman signed the Galleria over on a napkin. He kept the napkin.' },
  ],
};
