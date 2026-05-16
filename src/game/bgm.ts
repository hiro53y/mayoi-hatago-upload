import { useEffect } from 'react';

type BgmTarget =
  | { screen: 'title'; floor?: never }
  | { screen: 'game'; floor: number }
  | { screen: 'none'; floor?: never };

const TITLE_BGM = '/assets/bgm/title.mp3';

function floorBgmPath(floor: number) {
  const boundedFloor = Math.min(10, Math.max(1, Math.trunc(floor)));
  return `/assets/bgm/floor-${String(boundedFloor).padStart(2, '0')}.mp3`;
}

function bgmPath(target: BgmTarget) {
  if (target.screen === 'title') return TITLE_BGM;
  if (target.screen === 'game') return floorBgmPath(target.floor);
  return null;
}

export function useBgm(target: BgmTarget) {
  const src = bgmPath(target);

  useEffect(() => {
    if (!src) return undefined;

    const controller = new AbortController();
    let audio: HTMLAudioElement | null = null;
    let retryPlayback: (() => void) | null = null;

    const removeRetryListeners = () => {
      if (!retryPlayback) return;
      window.removeEventListener('pointerdown', retryPlayback);
      window.removeEventListener('keydown', retryPlayback);
      window.removeEventListener('touchstart', retryPlayback);
      retryPlayback = null;
    };

    const play = () => {
      if (!audio) return;
      audio.play().then(removeRetryListeners).catch(() => {
        if (retryPlayback) return;
        retryPlayback = () => {
          removeRetryListeners();
          play();
        };
        window.addEventListener('pointerdown', retryPlayback, { once: true });
        window.addEventListener('keydown', retryPlayback, { once: true });
        window.addEventListener('touchstart', retryPlayback, { once: true });
      });
    };

    fetch(src, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        if ((!response.ok && response.status !== 405) || controller.signal.aborted) return;
        audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0.52;
        audio.preload = 'auto';
        play();
      })
      .catch(() => {
        // BGM files are optional. Missing files should not block gameplay.
      });

    return () => {
      controller.abort();
      removeRetryListeners();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [src]);
}
