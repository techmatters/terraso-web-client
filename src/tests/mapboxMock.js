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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import mapboxgl from 'terraso-web-client/gis/mapbox';

/**
 * Map instance mock with REAL event-listener semantics: `on`/`once`/`off`
 * record handler ARRAYS per event type (the shared editor map has 3+
 * `move`/`moveend` registrants — last-one-wins recording hides drops), and
 * `fire(type, ...args)` dispatches to all of them (snapshot of the current
 * list, so handlers can unsubscribe while dispatching).
 */
export const createMapMock = (overrides = {}) => {
  const map = {
    onEvents: {},
    on: jest.fn((type, cb) => {
      (map.onEvents[type] ??= []).push(cb);
    }),
    once: jest.fn((type, cb) => {
      const wrapped = (...args) => {
        map.off(type, wrapped);
        cb(...args);
      };
      wrapped.__original = cb;
      (map.onEvents[type] ??= []).push(wrapped);
    }),
    off: jest.fn((type, cb) => {
      const handlers = map.onEvents[type];
      if (!handlers) {
        return;
      }
      if (!cb) {
        delete map.onEvents[type];
        return;
      }
      map.onEvents[type] = handlers.filter(
        handler => handler !== cb && handler.__original !== cb
      );
    }),
    fire: (type, ...args) => {
      [...(map.onEvents[type] ?? [])].forEach(handler => handler(...args));
    },
    remove: jest.fn(),
    getCanvas: jest.fn(),
    // mapbox attaches a control's DOM container when it is added (controls
    // do it in their onAdd) and detaches it on removal. Control doubles are
    // plain objects (module-factory mock impls are reset per test), so the
    // map models the attachment here: cleanup guards that check
    // `_container.parentNode` (MapGeocoder) behave like the real world — an
    // added control is attached, a removed one is detached.
    addControl: jest.fn(control => {
      if (control && !control._container) {
        control._container = { parentNode: {} };
      }
      control?.onAdd?.(map);
    }),
    removeControl: jest.fn(control => {
      control?.onRemove?.(map);
      if (control?._container) {
        control._container = { parentNode: null };
      }
    }),
    addSource: jest.fn(),
    getSource: jest.fn(),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    removeLayer: jest.fn(),
    moveLayer: jest.fn(),
    setPaintProperty: jest.fn(),
    getStyle: jest.fn(),
    setStyle: jest.fn(),
    setTerrain: jest.fn(),
    setFog: jest.fn(),
    fitBounds: jest.fn(),
    getBounds: jest.fn(),
    getCenter: jest.fn(),
    getZoom: jest.fn(),
    getPitch: jest.fn(),
    getBearing: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    jumpTo: jest.fn(),
    rotateTo: jest.fn(),
    stop: jest.fn(),
    getContainer: jest.fn(),
    hasImage: jest.fn(),
    addImage: jest.fn(),
    removeImage: jest.fn(),
    setPadding: jest.fn(),
    scrollZoom: { enable: jest.fn(), disable: jest.fn() },
    boxZoom: { enable: jest.fn(), disable: jest.fn() },
    dragRotate: { enable: jest.fn(), disable: jest.fn() },
    dragPan: { enable: jest.fn(), disable: jest.fn() },
    keyboard: {
      enable: jest.fn(),
      disable: jest.fn(),
      enableRotation: jest.fn(),
      disableRotation: jest.fn(),
    },
    doubleClickZoom: { enable: jest.fn(), disable: jest.fn() },
    touchZoomRotate: {
      enable: jest.fn(),
      disable: jest.fn(),
      enableRotation: jest.fn(),
      disableRotation: jest.fn(),
    },
    touchPitch: { enable: jest.fn(), disable: jest.fn() },
    resize: jest.fn(),
    ...overrides,
  };
  return map;
};

/**
 * A map mock that reports `load` immediately on registration (like a mapbox
 * map that is already loaded): `MapProvider` picks the instance up as soon
 * as it subscribes.
 */
export const createLoadedMapMock = (overrides = {}) => {
  const map = createMapMock(overrides);
  const record = map.on;
  map.on = jest.fn((type, cb) => {
    record(type, cb);
    if (type === 'load') {
      cb();
    }
  });
  return map;
};

export const setupMapboxMock = () => {
  beforeEach(() => {
    mapboxgl.Map = jest.fn().mockReturnValue(createMapMock());
    mapboxgl.LngLatBounds = jest.fn();
    mapboxgl.NavigationControl = jest.fn();
  });
};
