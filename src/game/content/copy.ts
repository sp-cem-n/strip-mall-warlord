// Words on the title, story and How to play screens. Pre-dawn copy: scripts/check.ts greps it for spoilers.
export const HOW = [
  ['The deal', "Every shop pays rent and sends one person to the parking lot. You start with Uncle Sal's pawn shop."],
  ['Fights', 'Win a fight a few times to move up; a boss once. Every win pays Goodwill. Damage sticks from one fight to the next. The crew keeps at it while the tab is closed, up to 8 hours.'],
  ['Dollars', 'Rent buys leases, renovations and patrols. The card says what the next renovation does.'],
  ['Goodwill', 'Training in the Back Office: five tracks, one per role.'],
  ['The lineup', 'Five fighters take the lot; more slots come later. Buffers stand on the curb and always count. Click the parking lot (or press R) for the roster: stats, DPS, Field and Bench. AUTO picks for you.'],
  ['Smoke breaks', 'After a loss, after a win where somebody went down, or on the way to a different fight, the crew takes five seconds out back and comes back at full HP. Lose a new fight at full HP and they drop back one to farm, then try again. The receipt says why. Click it for the history.'],
  ['Patrol', 'Hire a patrol on a lot sign and the crew moves up there on its own. Without one, press ▸.'],
  ['Overtime', 'Two minutes of rent: +25% HP and damage for the next three fights.'],
  ['Walk-ins', 'While you watch, somebody walks into a shop: cash, a referral, or a rally. Click them.'],
  ['The Fun Zone', 'Lease it and a door opens on the top bar. Quarters go in, money, Goodwill and tickets come out. Tickets buy prizes at the counter. The claw takes tickets.'],
  ['Your lease', 'The Back Office can copy a lease code out, or load one in. Confirm before a load overwrites the current run.'],
];

export const STORY: { text: string; note?: boolean }[] = [
  { text: 'Fall 1997. Route 9.' },
  { text: 'Your uncle Sal left you the lease on Unit A, his pawn shop, and a note:' },
  { text: "Don't let them pave it.", note: true },
  { text: "Pinewood Plaza peaked in 1991. The developer thinks it's done." },
  { text: "It isn't." },
  { text: 'P.S. The rest of the row is for lease. Fill it with people who can stand in a parking lot.', note: true },
];
