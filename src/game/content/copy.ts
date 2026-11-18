// Words on the title, story and How to play screens. Pre-dawn copy: scripts/check.ts greps it for spoilers.
export const HOW = [
  ['The deal', "Every shop pays rent and sends one person to the parking lot. You start with Uncle Sal's pawn shop."],
  ['Fights', 'Win a fight a few times to move up; a boss once. Every win pays Goodwill. Damage sticks from one fight to the next. The crew keeps at it while the tab is closed, up to 8 hours.'],
  ['Dollars', 'Rent buys leases and renovations. The card says what the next renovation does.'],
  ['Goodwill', 'Wins pay it. It buys training in the Back Office (five tracks, one per role) and patrols.'],
  ['The lineup', 'Five fighters take the lot; more slots come later. Buffers stand on the curb and always count. Click the parking lot (or press R) for the roster: stats, DPS, Field and Bench. AUTO picks for you.'],
  ['Smoke breaks', "After a loss, after a win where somebody went down, or on the way to a fight they haven't beaten, the crew takes five seconds out back and comes back at full HP. Lose a new fight at full HP and they drop back one to farm, then try again. The receipt says why; click it for the history."],
  ['Patrols', 'Hire one on a lot sign. On that lot the crew moves up on its own and drops back a fight when a new one is too much. ◂ parks them until ▸.'],
  ['Walk-ins', 'While you watch, somebody walks into a shop on screen: a little Goodwill, a shot at some tickets, or a rally. Click them.'],
  ['The Fun Zone', 'Lease it and a door opens on the top bar. Click a machine to play it. Quarters go in, tickets come out. Tickets buy prizes at the counter. The claw takes tickets.'],
  ['Saves', 'The game saves itself in this browser. The floppy on the top bar (or Saves on the title screen) copies it out as a lease code, or loads one in.'],
];

// The man by the Fun Zone pay phone, after the first repave. No name. Pre-reveal copy: the check greps it.
export const STRANGER = { lines: ["You came back after the paving. Most don't.", "I know where there's more."], button: 'HEAR HIM OUT' };

export const STORY: { text: string; note?: boolean }[] = [
  { text: 'Fall 1997. Route 9.' },
  { text: 'Your uncle Sal left you the lease on Unit A, his pawn shop, and a note:' },
  { text: "Don't let them pave it.", note: true },
  { text: "Pinewood Plaza peaked in 1991. The developer thinks it's done." },
  { text: "It isn't." },
  { text: 'P.S. The rest of the row is for lease. Fill it with people who can stand in a parking lot.', note: true },
];
