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

const toLngLat = value =>
  Array.isArray(value) ? { lng: value[0], lat: value[1] } : value;

/**
 * Minimal LngLatBounds stand-in: parses the constructor forms used by the
 * app and supports the corner/union math the fit logic needs. Production
 * reads getSouthWest/getNorthEast for the layer/viewport overlap test and
 * getWest/getSouth/getEast/getNorth for the union fit, so bounds mocks that
 * only implement isEmpty (or toArray) make those paths throw.
 */
export const createBounds = (...args) => {
  let sw;
  let ne;
  if (args.length === 1) {
    const arg = args[0];
    if (Array.isArray(arg) && Array.isArray(arg[0])) {
      sw = toLngLat(arg[0]);
      ne = toLngLat(arg[1]);
    } else {
      sw = toLngLat(arg);
      ne = toLngLat(arg);
    }
  } else {
    sw = toLngLat(args[0]);
    ne = toLngLat(args[1]);
  }
  const cornersOf = other =>
    other.args ?? [other.getSouthWest(), other.getNorthEast()];
  const bounds = {
    get args() {
      return [sw, ne];
    },
    isEmpty: () => false,
    extend: other => {
      const [otherSw, otherNe] = cornersOf(other);
      sw = {
        lng: Math.min(sw.lng, otherSw.lng),
        lat: Math.min(sw.lat, otherSw.lat),
      };
      ne = {
        lng: Math.max(ne.lng, otherNe.lng),
        lat: Math.max(ne.lat, otherNe.lat),
      };
      return bounds;
    },
    getSouthWest: () => sw,
    getNorthEast: () => ne,
    getWest: () => sw.lng,
    getSouth: () => sw.lat,
    getEast: () => ne.lng,
    getNorth: () => ne.lat,
    toArray: () => [
      [sw.lng, sw.lat],
      [ne.lng, ne.lat],
    ],
  };
  return bounds;
};

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
    // mapbox calls a control's onAdd/onRemove on add/remove (controls attach
    // their DOM container in onAdd). Control doubles are plain objects
    // (module-factory mock impls are reset per test), so the map models the
    // attachment here — with the property the real control uses:
    // @mapbox/mapbox-gl-geocoder v5 sets `container` (NOT `_container`).
    // Cleanup guards that check `container.parentNode` then behave like the
    // real world: an added control is attached, a removed one is detached.
    addControl: jest.fn(control => {
      if (control && !control.container) {
        control.container = { parentNode: {} };
      }
      control?.onAdd?.(map);
    }),
    removeControl: jest.fn(control => {
      control?.onRemove?.(map);
      if (control?.container) {
        control.container = { parentNode: null };
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
    getStyle: jest.fn().mockReturnValue({}),
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
    unproject: jest.fn().mockReturnValue({ lng: 0, lat: 0 }),
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
    mapboxgl.LngLatBounds = jest.fn((...args) => createBounds(...args));
    mapboxgl.NavigationControl = jest.fn();
  });
};
