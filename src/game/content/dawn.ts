// Every word that only makes sense after dawn on Route 9, in one place (besides content/bypass.ts).
// scripts/check.ts greps the rest of src/ for these words and fails if one turns up anywhere else.
import { GOODWILL_PER_EQUITY as R } from '../knobs';

export const DAWN = {
  equity: 'Equity',
  bypass: 'The Bypass',
  // the win card
  reveal: ['The state opened the Route 9 Bypass this morning. Exit 14 has a Self Storage with your name on the lease. New road, new crew, new money:', 'Equity', `. The bank will turn ${R} Goodwill into 1 Equity, any time.`],
  // tooltips and the bank
  goodwillTip: `The bank turns ${R} Goodwill into 1 Equity.`,
  equityTip: ['Equity', 'Bypass leases and training cost it. Bypass wins pay a little.', `Mostly you buy it: ${R} Route 9 Goodwill each.`, 'The bank calls it "a relationship."'],
  bankTip: `${R} Goodwill buys 1 Equity. One way.`,
  convertShort: `Takes ${R} Goodwill per Equity`,
  converted: (gw: number, eq: number) => `Converted ${gw} Goodwill into ${eq} Equity. The bank called it "a relationship."`,
  awayPay: ' / Equity',
  // the Bypass hints under the shops
  hintNew: 'Sal never made it up here. New road, new crew. Bring Goodwill: the bank turns it into Equity.',
  hintLease: 'Bypass leases cost Equity, not dollars. Convert Goodwill from Route 9, or win it here.',
  hintDone: 'Somebody is surveying Route 9 North. Not yet.',
  // the Off-Ramp
  bar: 'THE OFF-RAMP',
  barGo: 'Stop in at the Off-Ramp',
  barBack: 'Back to the Bypass',
  barSign: 'OFF-RAMP',
  // the green highway sign over the scoreboard: where it takes you from each road
  hwy: ['BYPASS ▸', '◂ RT 9'],
  galleriaSign: 'BYPASS GALLERIA',
  needsOffRamp: 'Lease the Off-Ramp',
  needsExit14: 'Capture the Exit 14 Power Center',
  needsGalleria: 'Clear fight 6 at the Bypass Galleria',
  quiz: '+10% Equity per win',
  genius: '+25% Equity per win',
  chairman: '+10% Equity per win.',
  shuffleBoard: (beat: number, slot: boolean, who: string) => `Shuffleboard: ${who} is off the board. Equity per win +${Math.round(0.06 * beat * 100)}%.${slot ? ' And a fighter slot.' : ''}`,
  shufflePanel: (pct: number) => ` · Equity per win +${pct}%`,
};
