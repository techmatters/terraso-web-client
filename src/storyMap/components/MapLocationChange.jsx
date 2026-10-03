/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { useEffect, useRef } from 'react';
import _ from 'lodash/fp';

import { useMap } from 'terraso-web-client/gis/components/Map';

/**
 * Records the USER's map camera as the active step's location (immediate
 * apply — the editor's draft autosave persists it).
 *
 * Programmatic map moves (the layer bounds fit requested by the configure
 * sidebar) must never be recorded as user camera edits: while a programmatic
 * move is pending (`programmaticMoveRef` > 0), every `moveend` is skipped.
 * The pending flag is cleared ONLY by real user interaction (pointer, wheel,
 * keyboard, double-click) — one request can fire several moveends (a real
 * mapbox bounds fit re-runs when the layer config object changes), and
 * resetting per moveend recorded the last one (found in E2E). A user grab
 * mid-fit voids the programmatic accounting and their move is recorded.
 * Recording happens on `moveend` only — a drag re-renders the editor once,
 * not 60x/s.
 */
export const MapLocationChange = ({
  onPositionChange,
  programmaticMoveRef,
}) => {
  const { map } = useMap();
  const fallbackRef = useRef(0);
  const moveRef = programmaticMoveRef ?? fallbackRef;

  useEffect(() => {
    if (!map) {
      return;
    }
    const recordUserMove = () => {
      if (moveRef.current > 0) {
        return;
      }
      onPositionChange({
        center: map.getCenter(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        bounds: _.flatten(map.getBounds().toArray()),
      });
    };
    const endProgrammaticMove = () => {
      moveRef.current = 0;
    };
    map.on('moveend', recordUserMove);
    const userInteractionEvents = [
      'dragstart',
      'mousedown',
      'touchstart',
      'wheel',
      'keydown',
      'dblclick',
    ];
    userInteractionEvents.forEach(event => map.on(event, endProgrammaticMove));

    return () => {
      map.off('moveend', recordUserMove);
      userInteractionEvents.forEach(event =>
        map.off(event, endProgrammaticMove)
      );
    };
  }, [map, onPositionChange, moveRef]);

  return null;
};

export default MapLocationChange;
