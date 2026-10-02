/*
 * Copyright © 2025 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import type { LngLatBounds, Map as MapboxMap } from 'mapbox-gl';

/**
 * THE programmatic camera-move protocol (single source of truth). Programmatic
 * fits must not be recorded as user camera edits (e.g. by the story map's
 * `MapLocationChange` recorder):
 *
 * - `fitMapBounds` announces its own camera application (begin/end around the
 *   call — synchronous for non-animated fits, until `moveend` for animated
 *   ones), so callers need no shared callbacks or pre-announce calls;
 * - a fit whose bounds resolve ASYNC (or that may never fire) announces its
 *   INTENT (begin + end-once on `moveend`), exactly the window the camera
 *   move can land in. The map stage does this for its fit-to-layer requests.
 *
 * The suppression counter is per mapbox map instance (WeakMap): `begin`
 * increments, `end` DECREMENTS (never zeroes), so overlapping programmatic
 * moves cannot leak user-camera writes while one of them is still applying.
 * Real user interaction always wins: `resetProgrammaticMove` clears the
 * counter (the recorder calls it on drag/mouse/touch/wheel starts).
 */
type ProgrammaticMoveGuard = {
  counter: number;
};

const guards = new WeakMap<object, ProgrammaticMoveGuard>();

const guardFor = (map: object): ProgrammaticMoveGuard => {
  let guard = guards.get(map);
  if (!guard) {
    guard = { counter: 0 };
    guards.set(map, guard);
  }
  return guard;
};

/** Announces the start of a programmatic camera move (increments the guard). */
export const beginProgrammaticMove = (map?: object | null) => {
  if (!map) {
    return;
  }
  guardFor(map).counter += 1;
};

/**
 * Announces the end of one programmatic camera move. Decrements (floors at 0)
 * so overlapping moves keep the suppression armed until ALL of them finish.
 */
export const endProgrammaticMove = (map?: object | null) => {
  if (!map) {
    return;
  }
  const guard = guardFor(map);
  guard.counter = Math.max(0, guard.counter - 1);
};

/** Drops all suppression (called on real user interaction). */
export const resetProgrammaticMove = (map?: object | null) => {
  if (!map) {
    return;
  }
  guardFor(map).counter = 0;
};

/** Whether a programmatic camera move is currently being applied. */
export const isProgrammaticMove = (map?: object | null): boolean =>
  Boolean(map) && guardFor(map as object).counter > 0;

/**
 * `map.fitBounds` wrapped in the programmatic-move protocol: the fit is
 * announced for exactly as long as its camera move is applied, so the move is
 * never recorded as a user camera edit. Non-animated fits apply synchronously
 * (mapbox `jumpTo` fires move events inside the call) and are announced
 * synchronously; animated fits stay announced until their `moveend`.
 */
export const fitMapBounds = (
  map: MapboxMap | null | undefined,
  bounds: LngLatBounds | [[number, number], [number, number]],
  options: { animate?: boolean } & Record<string, unknown> = {}
) => {
  if (!map) {
    return;
  }
  const hasEvents = typeof (map as { on?: unknown }).on === 'function';
  beginProgrammaticMove(map);
  const end = () => {
    map.off?.('moveend', end);
    endProgrammaticMove(map);
  };
  if (options.animate !== false && hasEvents) {
    map.on('moveend', end);
  }
  try {
    map.fitBounds(bounds, options);
  } finally {
    if (options.animate === false || !hasEvents) {
      endProgrammaticMove(map);
    }
  }
};

/**
 * Announces a FIT INTENT: the caller asked for a fit whose camera move will
 * land later (async bounds resolution) or may never fire. The intent window
 * is released when the move it could cause has ended (`moveend`) or when the
 * caller tears it down (its effect cleanup) — whichever comes first.
 * Returns the release function.
 */
export const announceFitIntent = (map?: object | null) => {
  if (!map) {
    return () => {};
  }
  beginProgrammaticMove(map);
  let released = false;
  const release = () => {
    if (released) {
      return;
    }
    released = true;
    (map as { off?: (event: string, handler: () => void) => void }).off?.(
      'moveend',
      release
    );
    endProgrammaticMove(map);
  };
  (map as { on?: (event: string, handler: () => void) => void }).on?.(
    'moveend',
    release
  );
  return release;
};
