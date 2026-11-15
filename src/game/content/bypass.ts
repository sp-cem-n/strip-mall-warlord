// The Route 9 Bypass: a new crew. New kinds of shops first, a few old ones trickle back in as franchises.
import type { RegionDef, ShopDef } from '../defs';
import { BOSS, E, S } from './make';

export const BYPASS_SHOPS: ShopDef[] = [
  S('storage', 'Self Storage', 'auction', 1, 0, -1, 0, 2, 'Climate controlled. Emotionally, not.', 'cash', 'Unit 114, behind on rent', 5),
  S('carwash', 'Car Wash', 'detailer', 1, 0, 2, 1, 3, 'The brushes have seen things.', 'rally', 'Wants the hot wax', 10),
  S('offramp', 'The Off-Ramp', 'bartender', 1, 0, 4, 2, 4, 'Cash only. Darts, pool, and a poker machine by the bathrooms.', 'cash', 'Regular, wants his stool back', 20),
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

export const BYPASS: RegionDef = {
  id: 1,
  name: 'The Bypass',
  pay: 'equity',
  leaseIn: 'equity',
  trainIn: 'equity',
  chrome: { plaza: 'Exit 14, Rt. 9 Bypass', mgmt: 'EXIT 14 MGMT', sub: 'Exit 14 · Rt. 9 Bypass · 1998' },
  start: 'storage',
  ending: 'The Bypass is yours. Route 9 North is still being surveyed.',
  lots: [
    { id: 'power', name: 'Exit 14 Power Center', short: 'Exit 14', blurb: 'Six big boxes, one parking lot, no trees. Opened 1998.', fights: 10, patrol: 500,
      regulars: [E('Power Center Security', 'Golf cart with a siren.', 45, 5, 1.4, 'auction'), E('Inventory Specialist', 'Counts things. Counts you.', 40, 6, 1.5, 'auction', 'hard'), E('Sweeper Truck Driver', 'Out at 3 a.m. Every night.', 70, 4, 1.8, 'bouncer', 'tanky')],
      boss: { ...E('Leasing Director', 'Fourteen anchor tenants and no patience.', 260, 9, 1.5, 'auction', 'hard'), joins: 'leasingdir' },
      clearText: 'The Leasing Director quit on a Friday. He left a voicemail.' },
    { id: 'campus', name: 'Corporate Campus', short: 'Campus', blurb: 'Mirrored glass. A pond with a fountain that is on, aggressively.', fights: 12, patrol: 50000,
      regulars: [E('Campus Security', 'Patrols the pond. Talks to the geese.', 55, 6, 1.4, 'bouncer'), E('Synergy Consultant', 'Here to align.', 45, 8, 1.6, 'auction', 'hard'), E('Shuttle Driver', 'Every 12 minutes. Never yours.', 75, 5, 1.7, 'bondsman', 'tanky')],
      boss: { ...E('VP of Real Estate Strategy', 'Circles back.', 340, 10, 1.5, 'auction', 'tanky'), joins: 'vp' },
      clearText: 'The VP of Real Estate Strategy circled back. To you.' },
    { id: 'towncenter', name: 'Town Center, Phase II', short: 'Phase II', blurb: 'Cranes, a model unit, and a banner that says LIVE WORK PLAY.', fights: 14, patrol: 80000,
      regulars: [E('Construction Flagger', 'SLOW. On both sides.', 70, 6, 1.6, 'golfpro', 'tanky'), E('Brand Ambassador', 'Free tote bag. Not free.', 45, 8, 1.3, 'golfpro', 'hard'), E('Render Artist', 'Draws people who are happier than you.', 50, 7, 1.5, 'lawyer')],
      boss: { ...E('Managing Partner', 'Has a boat.', 420, 12, 1.5, 'lawyer', 'hard'), joins: 'partner' },
      clearText: 'The Managing Partner sold the boat. He says it was his idea.' },
    { id: 'galleria', name: 'Bypass Galleria', short: 'Galleria', blurb: 'Two levels, a glass elevator, and a carousel nobody is allowed to ride.', fights: 16, patrol: 2e6,
      regulars: [E('Mall Cop (Segway)', 'Top speed: 12 mph. Uses all of it.', 55, 7, 1.3, 'golfpro', 'hard'), E('Kiosk Manager', 'Runs six kiosks. Remembers your face.', 60, 7, 1.5, 'lawyer'), E('Escalator Tech', 'Out of order. Always.', 85, 6, 1.7, 'groomer', 'tanky')],
      boss: { ...E('The Chairman', 'Owns the mall. And the chair.', 520, 14, 1.4, 'lawyer', 'tanky'), joins: 'chairman' },
      clearText: 'The Chairman signed the Galleria over on a napkin. He kept the napkin.' },
  ],
};
