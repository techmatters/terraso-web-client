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

export const createMapMock = (overrides = {}) => ({
  on: jest.fn(),
  off: jest.fn(),
  remove: jest.fn(),
  getCanvas: jest.fn(),
  addControl: jest.fn(),
  removeControl: jest.fn(),
  addSource: jest.fn(),
  getSource: jest.fn(),
  addLayer: jest.fn(),
  getLayer: jest.fn(),
  setTerrain: jest.fn(),
  fitBounds: jest.fn(),
  getBounds: jest.fn(),
  getStyle: jest.fn(),
  getZoom: jest.fn(),
  getCenter: jest.fn(),
  flyTo: jest.fn(),
  getContainer: jest.fn(),
  hasImage: jest.fn(),
  addImage: jest.fn(),
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
});

export const setupMapboxMock = () => {
  beforeEach(() => {
    mapboxgl.Map = jest.fn().mockReturnValue(createMapMock());
    mapboxgl.LngLatBounds = jest.fn((...args) => createBounds(...args));
    mapboxgl.NavigationControl = jest.fn();
  });
};
