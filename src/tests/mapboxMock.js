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
    mapboxgl.LngLatBounds = jest.fn();
    mapboxgl.NavigationControl = jest.fn();
  });
};
