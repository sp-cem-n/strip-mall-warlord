// Words on the title, story and How to play screens. Pre-dawn copy: scripts/check.ts greps it for spoilers.
export const HOW = [
  ['The deal', "Every shop pays rent and sends one person to the parking lot. You start with Uncle Sal's pawn shop."],
  ['Fights', 'Win a fight a few times to move up; a boss once. Every win pays Goodwill. The crew keeps at it while the tab is closed, up to 8 hours.'],
  ['Dollars', 'Rent buys leases, renovations and patrols. The card says what the next renovation does.'],
  ['Goodwill', 'Training in the Back Office: five tracks, one per role.'],
  ['The lineup', 'Five fighters take the lot; more slots come later. Buffers stand on the curb and always count. FIELD and BENCH on a card pick by hand. AUTO picks for you.'],
  ['Losses', 'Lose and the crew drops back a fight to farm, then tries again. The receipt says why. Click the receipt for the history.'],
  ['Patrol', 'A lot with a patrol contract moves up on its own. Without one, press ▸. The Security Office sells them past the Parking Lot and makes them cheaper.'],
  ['The play', 'Even, Rush or Dig In. Rush beats tanky. Dig In beats hard hitters.'],
  ['Overtime', 'Two minutes of rent: +25% HP and damage for the next three fights.'],
  ['Walk-ins', 'While you watch, somebody walks into a shop: cash, a referral, or a rally. Click them.'],
  ['The Fun Zone', 'Lease it and the Back Office gets an Arcade tab. Quarters go in, money, Goodwill and tickets come out. Tickets buy slots and perks at the prize counter. The claw takes tickets.'],
];

export const STORY: { text: string; note?: boolean }[] = [
  { text: 'Fall 1997. Route 9.' },
  { text: 'Your uncle Sal left you the lease on Unit A, his pawn shop, and a note:' },
  { text: "Don't let them pave it.", note: true },
  { text: "Pinewood Plaza peaked in 1991. The developer thinks it's done." },
  { text: "It isn't." },
  { text: 'P.S. The rest of the row is for lease. Fill it with people who can stand in a parking lot.', note: true },
];
