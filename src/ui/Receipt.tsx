// The log is the management office's receipt printer, up top by the sign. Red ink for losses, like a real two-color printer.
import { app } from '../app';
import { REGIONS } from '../game/defs';
import { fmtTime } from './format';

const FOOTERS = ['NO REFUNDS. NO EXCEPTIONS.', 'PARKING VALIDATED: NEVER', 'THANK YOU FOR SHOPPING PINEWOOD PLAZA', 'ASK ABOUT OUR VACANCIES', 'NOT A RECEIPT FOR TAX PURPOSES', 'HAVE A NICE NIGHT. NO LOITERING.'];

export function Receipt() {
  const s = app.s;
  const lines = s.log.filter((l) => l.r === s.view).slice(-5).reverse();
  return (
    <section class="printer">
      <div class="printer-head">
        <span>{REGIONS[s.view].chrome.mgmt} · ACTIVITY</span>
        <span class="printer-light" />
      </div>
      <div class="paper">
        <ul>
          {lines.map((l, i) => (
            <li key={`${l.t}-${i}`} class={`r-${l.tone}`}>
              <span class="t">{fmtTime(l.t)}</span>
              <span>
                {l.tone === 'capture' ? `*** ${l.text} ***` : l.text}
                {l.n && <b> x{l.n}</b>}
              </span>
            </li>
          ))}
        </ul>
        <div class="r-foot">{FOOTERS[(s.crews[s.view].wins + s.paves) % FOOTERS.length]}</div>
      </div>
    </section>
  );
}
