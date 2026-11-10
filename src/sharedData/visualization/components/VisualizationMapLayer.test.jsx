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

import { render } from 'terraso-web-client/tests/utils';
import { useEffect } from 'react';
import { act } from '@testing-library/react';

import { MapProvider, useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import VisualizationMapLayer from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';

jest.mock(
  'terraso-web-client/sharedData/visualization/visualizationMarkers',
  () => ({
    getLayerImage: jest.fn(),
  })
);

const SOURCE_URL = 'https://data.example.org/points.geojson';

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 20] },
      properties: {},
    },
  ],
};

const CONFIG_BOUNDS = {
  southWest: { lng: 1, lat: 2 },
  northEast: { lng: 3, lat: 4 },
};

let mapMock;
let sourceMock;
let fetchMock;
let loaded;
let viewport;

const toLngLat = value =>
  Array.isArray(value) ? { lng: value[0], lat: value[1] } : value;

// Minimal LngLatBounds stand-in: parses the constructor forms used by the
// component and supports the union/intersection math the fit logic needs.
const createBounds = (...args) => {
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
  };
  return bounds;
};

const createSource = ({ data, bounds } = {}) => ({
  loaded: () => loaded,
  _data: data,
  bounds,
});

const createMapMock = () => ({
  on: jest.fn(),
  off: jest.fn(),
  getSource: jest.fn(() => sourceMock),
  fitBounds: jest.fn(),
  getBounds: jest.fn(() => viewport),
  getStyle: jest.fn(() => ({})),
  getLayer: jest.fn(() => undefined),
  hasImage: jest.fn(() => false),
  addImage: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  removeSource: jest.fn(),
  getCanvas: jest.fn(() => ({ style: {} })),
});

const MapHarness = ({ map }) => {
  const { setMap } = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
};

const renderLayer = async props => {
  const view = await render(
    <MapProvider>
      <MapHarness map={mapMock} />
      <VisualizationMapLayer sourceName="visualization" {...props} />
    </MapProvider>
  );
  await act(async () => {});
  return view;
};

beforeEach(() => {
  loaded = true;
  sourceMock = undefined;
  // Far away from every fixture's coordinates, so the fit path is exercised
  // unless a test overrides it.
  viewport = createBounds([100, 10], [101, 11]);
  mapMock = createMapMock();
  fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    json: jest.fn().mockResolvedValue(GEOJSON),
  });
  mapboxgl.LngLat = jest.fn((lng, lat) => ({ lng, lat }));
  mapboxgl.LngLatBounds = jest.fn((...args) => createBounds(...args));
  mapboxgl.Popup = jest.fn(() => ({
    setDOMContent: jest.fn(),
    setLngLat: jest.fn(),
    addTo: jest.fn(),
    isOpen: jest.fn(() => false),
  }));
});

test('does not fetch or fit bounds when changeBounds is false (URL source)', async () => {
  sourceMock = createSource({ data: SOURCE_URL });

  await renderLayer({ changeBounds: false });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(mapMock.fitBounds).not.toHaveBeenCalled();
});

test('uses config bounds and skips the source fetch when useConfigBounds is set', async () => {
  sourceMock = createSource({ data: SOURCE_URL });

  await renderLayer({
    changeBounds: true,
    useConfigBounds: true,
    visualizationConfig: { viewportConfig: { bounds: CONFIG_BOUNDS } },
  });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
  expect(mapMock.fitBounds).toHaveBeenCalledWith(
    expect.objectContaining({
      args: [
        { lng: 1, lat: 2 },
        { lng: 3, lat: 4 },
      ],
    }),
    expect.objectContaining({ animate: false, maxZoom: 18 })
  );
});

test('does not move the map when the layer bounds intersect the viewport', async () => {
  sourceMock = createSource({ data: GEOJSON });
  // Contains the fixture's [10, 20] point.
  viewport = createBounds([0, 0], [30, 30]);

  await renderLayer({ changeBounds: true, avoidMoveWhenVisible: true });

  expect(mapMock.fitBounds).not.toHaveBeenCalled();
});

test('fits the viewport-layer union when the layer is completely outside and avoidMoveWhenVisible is set', async () => {
  sourceMock = createSource({ data: GEOJSON });

  await renderLayer({ changeBounds: true, avoidMoveWhenVisible: true });

  expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
  expect(mapMock.fitBounds).toHaveBeenCalledWith(
    expect.objectContaining({
      args: [
        { lng: 10, lat: 10 },
        { lng: 101, lat: 20 },
      ],
    }),
    expect.objectContaining({ animate: false, maxZoom: 18 })
  );
});

test('fetches the URL source once and fits the computed bounds when bounds are needed', async () => {
  sourceMock = createSource({ data: SOURCE_URL });

  await renderLayer({ changeBounds: true });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(SOURCE_URL);
  expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
  expect(mapMock.fitBounds).toHaveBeenCalledWith(
    expect.objectContaining({
      args: [
        { lng: 10, lat: 20 },
        { lng: 10, lat: 20 },
      ],
    }),
    expect.objectContaining({ animate: false, maxZoom: 18 })
  );
});

test('does not fetch when the source already exposes bounds', async () => {
  const sourceBounds = [
    [0, 0],
    [5, 5],
  ];
  sourceMock = createSource({ data: SOURCE_URL, bounds: sourceBounds });

  await renderLayer({ changeBounds: true });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
  expect(mapMock.fitBounds).toHaveBeenCalledWith(
    expect.objectContaining({
      args: [
        { lng: 0, lat: 0 },
        { lng: 5, lat: 5 },
      ],
    }),
    expect.objectContaining({ animate: false, maxZoom: 18 })
  );
});

test('computes bounds from inline geojson without fetching', async () => {
  sourceMock = createSource({ data: GEOJSON });

  await renderLayer({ changeBounds: true });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
  expect(mapMock.fitBounds).toHaveBeenCalledWith(
    expect.objectContaining({
      args: [
        { lng: 10, lat: 20 },
        { lng: 10, lat: 20 },
      ],
    }),
    expect.objectContaining({ animate: false, maxZoom: 18 })
  );
});

test('does not fit bounds from a stale effect run after unmount', async () => {
  sourceMock = createSource({ data: SOURCE_URL });
  let resolveFetch;
  fetchMock.mockReturnValueOnce(
    new Promise(resolve => {
      resolveFetch = resolve;
    })
  );

  const { unmount } = await renderLayer({ changeBounds: true });

  await act(async () => {
    unmount();
    resolveFetch({ json: jest.fn().mockResolvedValue(GEOJSON) });
  });
  await act(async () => {});

  expect(mapMock.fitBounds).not.toHaveBeenCalled();
});

test('does not leave an unhandled rejection when fitBounds throws', async () => {
  sourceMock = createSource({ data: SOURCE_URL });
  mapMock.fitBounds.mockImplementation(() => {
    throw new Error('fitBounds exploded');
  });

  const onUnhandledRejection = jest.fn();
  process.on('unhandledRejection', onUnhandledRejection);
  try {
    await renderLayer({ changeBounds: true });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  } finally {
    process.removeListener('unhandledRejection', onUnhandledRejection);
  }
});
