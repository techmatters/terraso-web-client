import { render } from 'tests/utils';
import React from 'react';

import Map from 'gis/components/Map';
import mapboxgl from 'gis/mapbox';

jest.mock('gis/mapbox', () => ({}));

beforeEach(() => {
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.mockReturnValue({
    on: jest.fn(),
    remove: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
  });
});

test('Map: Rejects invalid initial bounds', async () => {
  await render(<Map initialBounds={[-181, 0, 0, 0]} />);

  const mapCall = mapboxgl.Map.mock.calls[0][0];
  expect(mapCall.bounds).toBeUndefined();
});

test('Map: Accepts valid initial bounds', async () => {
  await render(<Map initialBounds={[-180, 0, 0, 0]} />);

  const mapCall = mapboxgl.Map.mock.calls[0][0];
  expect(mapCall.bounds).toEqual([-180, 0, 0, 0]);
});
