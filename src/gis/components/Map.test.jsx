/*
 * Copyright © 2023 Technology Matters
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

import { act, render } from 'terraso-web-client/tests/utils';
import {
  createLoadedMapMock,
  setupMapboxMock,
} from 'terraso-web-client/tests/mapboxMock';

import Map, { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';

jest.mock('terraso-web-client/gis/mapbox', () => ({}));

setupMapboxMock();

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

test('Map: re-enabling interactivity restores keyboard and boxZoom too', async () => {
  const map = createLoadedMapMock();
  mapboxgl.Map.mockReturnValue(map);
  const { rerender } = await render(<Map interactive={false} />);

  expect(map.keyboard.disable).toHaveBeenCalled();
  expect(map.boxZoom.disable).toHaveBeenCalled();
  expect(map.keyboard.disableRotation).toHaveBeenCalled();

  map.keyboard.enable.mockClear();
  map.boxZoom.enable.mockClear();
  map.keyboard.enableRotation.mockClear();
  await act(async () => {
    rerender(<Map interactive />);
  });

  // The disable/enable lists must be symmetric: the fullscreen surface is
  // not less keyboard-capable than the dialog it replaced.
  expect(map.keyboard.enable).toHaveBeenCalled();
  expect(map.boxZoom.enable).toHaveBeenCalled();
  expect(map.keyboard.enableRotation).toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// Style-switch registry merge: the overlay mutates the SHARED map, so a
// style change must merge the sources/layers registry as it is WHEN THE FETCH
// RESOLVES (not as it was when changeStyle was called), or a fetch that lands
// after the session teardown resurrects deleted draft layers and wipes the
// editor's layers.
// ---------------------------------------------------------------------------

let pendingStyleFetches = [];
const originalFetch = global.fetch;

beforeEach(() => {
  pendingStyleFetches = [];
  global.fetch = jest.fn(
    () =>
      new Promise(resolve => {
        pendingStyleFetches.push(style =>
          resolve({ json: () => Promise.resolve(style) })
        );
      })
  );
});

afterAll(() => {
  global.fetch = originalFetch;
});

let mapApi;
const Probe = () => {
  mapApi = useMap();
  return null;
};

const NEW_STYLE = {
  sources: { 'basemap-source': { type: 'vector' } },
  layers: [{ id: 'basemap-layer', type: 'fill' }],
};

const mountEditorStack = () =>
  act(() => {
    mapApi.addSource('editor-source', { type: 'geojson', data: {} });
    mapApi.addLayer({
      id: 'editor-layer',
      type: 'fill',
      source: 'editor-source',
    });
  });

const mountDraftStack = () =>
  act(() => {
    mapApi.addSource('draft-source', { type: 'geojson', data: {} });
    mapApi.addLayer({ id: 'draft-layer', type: 'fill', source: 'draft-source' });
  });

const unmountDraftStack = () =>
  act(() => {
    mapApi.removeLayer('draft-layer');
    mapApi.removeSource('draft-source');
  });

const unmountEditorStack = () =>
  act(() => {
    mapApi.removeLayer('editor-layer');
    mapApi.removeSource('editor-source');
  });

/**
 * The P0 ghost-layer scenario: overlay opens (editor layers unmount, draft
 * layers mount) → user switches the basemap (style fetch pending) → session
 * tears down without confirm (draft unmounts, editor remounts). Both fetch
 * orderings must end with a map holding EXACTLY the editor's layers.
 */
describe('Map: style switch merges the layer registry at merge time', () => {
  it.each([
    ['the style fetch resolves AFTER the teardown', false],
    ['the style fetch resolves BEFORE the teardown', true],
  ])(
    'heals the layer stack when %s',
    async (_label, resolveBeforeTeardown) => {
      const map = createLoadedMapMock();
      mapboxgl.Map.mockReturnValue(map);
      await render(
        <Map>
          <Probe />
        </Map>
      );

      mountEditorStack();
      // Overlay opens: the editor's layers unmount, the draft's mount.
      unmountEditorStack();
      mountDraftStack();

      // User switches the basemap; the style fetch is still in flight.
      act(() => {
        mapApi.changeStyle('mapbox://styles/mapbox/satellite-v9');
      });
      expect(pendingStyleFetches).toHaveLength(1);
      const resolveStyle = pendingStyleFetches[0];

      if (resolveBeforeTeardown) {
        await act(async () => resolveStyle(NEW_STYLE));
        // Teardown AFTER the fetch landed: the draft layers must still be
        // removed from the map (post-setStyle removal heals the stack).
        unmountDraftStack();
        mountEditorStack();
        const setStyleOrder = map.setStyle.mock.invocationCallOrder[0];
        const removeDraftOrder = map.removeLayer.mock.calls.findIndex(
          ([id]) => id === 'draft-layer'
        );
        expect(
          map.removeLayer.mock.invocationCallOrder[removeDraftOrder]
        ).toBeGreaterThan(setStyleOrder);
      } else {
        // Teardown BEFORE the fetch lands: the merged style must reflect the
        // registry AT MERGE TIME — the draft layers are gone for good and the
        // editor's layers are preserved (today's closure capture resurrects
        // 'draft-layer' and drops 'editor-layer').
        unmountDraftStack();
        mountEditorStack();
        await act(async () => resolveStyle(NEW_STYLE));

        const mergedStyle = map.setStyle.mock.calls[0][0];
        expect(mergedStyle.layers.map(layer => layer.id)).toEqual(
          expect.arrayContaining(['editor-layer', 'basemap-layer'])
        );
        expect(mergedStyle.layers.map(layer => layer.id)).not.toContain(
          'draft-layer'
        );
        expect(Object.keys(mergedStyle.sources)).toEqual(
          expect.arrayContaining(['editor-source', 'basemap-source'])
        );
        expect(Object.keys(mergedStyle.sources)).not.toContain('draft-source');
      }
    }
  );
});
