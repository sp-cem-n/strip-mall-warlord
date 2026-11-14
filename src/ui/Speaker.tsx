import { app, tip } from '../app';
import { icon } from './art';
import { setMuted, sound, unlockAudio } from './audio';

// one shared mute, used on the pylon and the title screen
export function Speaker({ corner = false }: { corner?: boolean }) {
  const toggle = () => {
    unlockAudio();
    setMuted(!sound.muted);
    app.refresh();
  };
  return (
    <button class={`speaker ${corner ? 'corner' : ''}`} onClick={toggle} aria-label={sound.muted ? 'Unmute' : 'Mute'} {...tip(sound.muted ? 'Sound off' : 'Sound on', 'Lamp hum, the register, the cart. Click to toggle.')}>
      <img src={icon(sound.muted ? 'muted' : 'speaker')} width={27} height={27} alt="" />
    </button>
  );
}
