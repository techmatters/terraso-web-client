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

import { act, render, screen } from 'terraso-web-client/tests/utils';
import {
  createLoadedMapMock,
  setupMapboxMock,
} from 'terraso-web-client/tests/mapboxMock';

import mapboxgl from 'terraso-web-client/gis/mapbox';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';

// Mock mapboxgl
jest.mock('terraso-web-client/gis/mapbox', () => ({}));

jest.mock('terraso-web-client/storyMap/components/StoryMapLayer', () => ({
  __esModule: true,
  StoryMapLayer: ({ config }) => (
    <div data-testid={`mock-layer-${config.id}`} />
  ),
}));

// The overlay itself is exercised by MapConfigurationDialog.test.tsx: here it
// is a stub so the specs can pin how StoryMap HOSTS it over the editor map.
jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog',
  () => ({
    __esModule: true,
    MapConfigurationDialog: ({ title }) => (
      <div
        data-testid="map-config-dialog-stub"
        role="dialog"
        aria-label={title || 'Edit map'}
      />
    ),
  })
);

setupMapboxMock();

const CONFIG = {
  style: 'mapbox://styles/terraso/test',
  title: 'Story Map Title',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
      location: {
        center: { lng: -79.89, lat: -2.42 },
        zoom: 5,
      },
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    },
  ],
  dataLayers: {
    'layer-a': {
      id: 'layer-a',
      title: 'Layer A',
      ownerType: 'StoryMapNode',
      geojsonSignedUrl: 'https://example.com/layer-a.geojson',
    },
  },
};

const overlayStub = <div data-testid="map-config-dialog-stub" role="dialog" />;

// The map mock reports `load` (like a real mapbox map that is already
// loaded) so MapProvider picks the instance up.
const setup = async ({ overlay } = {}) => {
  const map = createLoadedMapMock();
  mapboxgl.Map.mockReturnValue(map);
  const utils = await render(
    <StoryMap config={CONFIG} mapConfigOverlay={overlay} />
  );
  return { ...utils, map };
};

describe('StoryMap: map configuration overlay hosting', () => {
  it('renders the overlay inside the live editor map', async () => {
    await setup({ overlay: overlayStub });

    const overlay = screen.getByTestId('map-config-dialog-stub');
    // The overlay is hosted as a child of the shared map (its map controls use
    // the editor map's context) instead of mounting a second map.
    expect(document.getElementById('map').contains(overlay)).toBe(true);
    expect(mapboxgl.Map).toHaveBeenCalledTimes(1);
  });

  it('dims the chapter content and passes mouse events through while open', async () => {
    await setup({ overlay: overlayStub });

    const features = document.getElementById('features');
    expect(features).toHaveStyle({ opacity: 0.2, pointerEvents: 'none' });
  });

  it('restores the chapter content after the overlay closes', async () => {
    const { rerender } = await setup({ overlay: overlayStub });

    await act(async () => {
      rerender(<StoryMap config={CONFIG} />);
    });

    const features = document.getElementById('features');
    expect(features).not.toHaveStyle({ opacity: 0.2 });
    expect(features).not.toHaveStyle({ pointerEvents: 'none' });
  });

  it('enables map interaction while open and restores it on close', async () => {
    const { rerender, map } = await setup({ overlay: overlayStub });

    // Map interaction (drag/zoom) is on while the overlay is open…
    expect(map.dragPan.enable).toHaveBeenCalled();
    expect(document.getElementById('map')).toHaveStyle({
      pointerEvents: 'auto',
    });

    map.dragPan.disable.mockClear();
    await act(async () => {
      rerender(<StoryMap config={CONFIG} />);
    });

    // …and restored to the editor's normal (non-interactive) state on close.
    expect(map.dragPan.disable).toHaveBeenCalled();
    expect(document.getElementById('map')).toHaveStyle({
      pointerEvents: 'none',
    });
  });

  it('hides its own map layers while the overlay is open and restores them after', async () => {
    const { rerender } = await setup({ overlay: overlayStub });

    // The overlay's draft preview owns the layer stack while open — the
    // editor must not mount the same layer ids alongside it.
    expect(screen.queryByTestId('mock-layer-layer-a')).not.toBeInTheDocument();

    await act(async () => {
      rerender(<StoryMap config={CONFIG} />);
    });

    expect(screen.getByTestId('mock-layer-layer-a')).toBeInTheDocument();
  });
});
