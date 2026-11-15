// The log is the management office's receipt printer, up top by the sign. Red ink for losses, like a real two-color printer.
// Click it and the paper unrolls: the last 60 lines for this crew, scrolling.
import { app, tip } from '../app';
import { REGIONS } from '../game/defs';
import { fmtTime } from './format';

const FOOTERS = ['NO REFUNDS. NO EXCEPTIONS.', 'PARKING VALIDATED: NEVER', 'THANK YOU FOR SHOPPING PINEWOOD PLAZA', 'ASK ABOUT OUR VACANCIES', 'NOT A RECEIPT FOR TAX PURPOSES', 'HAVE A NICE NIGHT. NO LOITERING.'];
export const receipt = { open: false };

export function Receipt() {
  const s = app.s;
  const all = s.log.filter((l) => l.r === s.view).reverse();
  const lines = receipt.open ? all : all.slice(0, 4); // four lines rolled up, so the printer is no taller than the pylon
  const toggle = (e: MouseEvent) => {
    const el = (e.currentTarget as HTMLElement).closest('.printer') as HTMLElement;
    if (!receipt.open) el.style.setProperty('--printer-h', `${el.offsetHeight}px`);
    receipt.open = !receipt.open;
    app.tip = null;
    app.refresh();
  };
  return (
    <section class={`printer ${receipt.open ? 'open' : ''}`}>
      <button class="printer-head" onClick={toggle} {...tip(receipt.open ? 'Roll it back up' : 'Unroll the receipt', `The last ${all.length} lines.`)}>
        <span>{REGIONS[s.view].chrome.mgmt} · ACTIVITY</span>
        <span class="printer-light" />
      </button>
      <div class="paper" onClick={toggle}>
        <ul>
          {lines.map((l, i) => (
            <li key={`${l.t}-${i}`} class={`r-${l.tone}`}>
              <span class="t">{fmtTime(l.t)}</span>
              <span class="x">
                {l.tone === 'capture' ? `*** ${l.text} ***` : l.text}
                {l.n && <b> x{l.n}</b>}
              </span>
            </li>
          ))}
        </ul>
        <div class="r-foot">{receipt.open ? '- - - TEAR HERE - - -' : FOOTERS[(s.crews[s.view].wins + s.paves) % FOOTERS.length]}</div>
      </div>
    </section>
  );
}
