// BGM：タイトルと各帯の曲（public/assets/bgm の mp3。無ければ鳴らさない）
import { useEffect } from 'react';
import type { RunMode } from '../engine/types';

const TITLE = '/assets/bgm/title.mp3';

/** 階 → 曲（10曲を階の深さに割り当てる） */
export function floorTrack(mode: RunMode, floor: number): string {
  let n: number;
  if (mode === 'main') n = Math.min(10, Math.ceil(floor / 3));
  else if (mode === 'deep') n = Math.min(10, Math.floor(((floor - 1) % 30) / 3) + 1);
  else if (mode === 'daily') n = Math.min(10, floor);
  else n = 1;
  return `/assets/bgm/floor-${String(n).padStart(2, '0')}.mp3`;
}

export function titleTrack() {
  return TITLE;
}

let current: HTMLAudioElement | null = null;
let currentSrc = '';
let volume = 0.5;
let pending: (() => void) | null = null;

export function setBgmVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (current) current.volume = volume;
  if (volume <= 0 && current) current.pause();
}

function clearPending() {
  if (!pending) return;
  window.removeEventListener('pointerdown', pending);
  window.removeEventListener('keydown', pending);
  pending = null;
}

/** 曲を切り替える（同じ曲なら何もしない） */
export function playBgm(src: string | null) {
  if (src === currentSrc && current && !current.paused) return;
  if (current && src !== currentSrc) {
    current.pause();
    current = null;
  }
  currentSrc = src ?? '';
  clearPending();
  if (!src || volume <= 0) return;
  if (!current) {
    current = new Audio(src);
    current.loop = true;
    current.preload = 'auto';
  }
  current.volume = volume;
  const audio = current;
  audio.play().catch(() => {
    // 自動再生が止められた時は、最初に触れた時に鳴らす
    pending = () => {
      clearPending();
      if (audio === current) audio.play().catch(() => undefined);
    };
    window.addEventListener('pointerdown', pending, { once: true });
    window.addEventListener('keydown', pending, { once: true });
  });
}

export function useBgm(src: string | null, vol: number) {
  useEffect(() => {
    setBgmVolume(vol);
  }, [vol]);
  useEffect(() => {
    playBgm(src);
  }, [src, vol]);
}
