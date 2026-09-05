import { isTauri } from '@tauri-apps/api/core';
import {
  getCurrentWindow,
  monitorFromPoint,
  PhysicalPosition,
  PhysicalSize,
} from '@tauri-apps/api/window';

const STORAGE_KEY = 'dofus-guide-companion.window.v1';
const MIN_WIDTH = 300;
const MIN_HEIGHT = 220;
const MAX_DIMENSION = 10_000;

type WindowGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function loadWindowGeometry(): WindowGeometry | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<WindowGeometry>;
    if (
      !isFiniteNumber(parsed.x) ||
      !isFiniteNumber(parsed.y) ||
      !isFiniteNumber(parsed.width) ||
      !isFiniteNumber(parsed.height) ||
      parsed.width < MIN_WIDTH ||
      parsed.height < MIN_HEIGHT ||
      parsed.width > MAX_DIMENSION ||
      parsed.height > MAX_DIMENSION
    ) {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
      width: parsed.width,
      height: parsed.height,
    };
  } catch {
    return null;
  }
}

function saveWindowGeometry(geometry: WindowGeometry): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(geometry));
}

export async function restoreAndPersistWindowGeometry(): Promise<() => void> {
  if (!isTauri()) {
    return () => undefined;
  }

  const appWindow = getCurrentWindow();
  const saved = loadWindowGeometry();

  if (saved) {
    await appWindow.setSize(new PhysicalSize(saved.width, saved.height));

    const savedMonitor = await monitorFromPoint(
      saved.x + saved.width / 2,
      saved.y + saved.height / 2,
    );

    if (savedMonitor) {
      await appWindow.setPosition(new PhysicalPosition(saved.x, saved.y));
    }
  }

  const [position, size] = await Promise.all([
    appWindow.outerPosition(),
    appWindow.innerSize(),
  ]);

  let geometry: WindowGeometry = {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
  saveWindowGeometry(geometry);

  const unlistenMoved = await appWindow.onMoved(({ payload }) => {
    geometry = { ...geometry, x: payload.x, y: payload.y };
    saveWindowGeometry(geometry);
  });

  const unlistenResized = await appWindow.onResized(({ payload }) => {
    geometry = { ...geometry, width: payload.width, height: payload.height };
    saveWindowGeometry(geometry);
  });

  return () => {
    unlistenMoved();
    unlistenResized();
  };
}
