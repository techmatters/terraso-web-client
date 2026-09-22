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
  mapMock = createMapMock();
  fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    json: jest.fn().mockResolvedValue(GEOJSON),
  });
  mapboxgl.LngLat = jest.fn((lng, lat) => ({ lng, lat }));
  mapboxgl.LngLatBounds = jest.fn((...args) => ({
    args,
    isEmpty: () => false,
  }));
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
    { animate: false }
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
        [10, 20],
        [10, 20],
      ],
    }),
    { animate: false }
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
    expect.objectContaining({ args: [sourceBounds] }),
    { animate: false }
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
        [10, 20],
        [10, 20],
      ],
    }),
    { animate: false }
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
