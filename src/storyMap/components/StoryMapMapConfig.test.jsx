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
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';

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
// The stub PUBLISHES a draft layer stack (like the real overlay) so the specs
// see the one-mount-per-layer-id dataset swap.
jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog',
  () => {
    const { useEffect } = jest.requireActual('react');
    const { usePublishMapConfigLayerStack } = jest.requireActual(
      'terraso-web-client/storyMap/components/mapConfigLayerStack'
    );
    return {
      __esModule: true,
      MapConfigurationDialog: ({ title }) => {
        const publishLayerStack = usePublishMapConfigLayerStack();
        useEffect(() => {
          publishLayerStack({
            configs: [
              {
                id: 'layer-draft',
                title: 'Draft Layer',
                ownerType: 'StoryMapNode',
                geojsonSignedUrl: 'https://example.com/layer-draft.geojson',
              },
            ],
            order: [{ layerId: 'layer-draft' }],
          });
          return () => publishLayerStack(null);
          // The host's publisher is a state setter (stable): pin the draft
          // to one publish per session.
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return (
          <div
            data-testid="map-config-dialog-stub"
            role="dialog"
            aria-label={title || 'Edit map'}
          />
        );
      },
    };
  }
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
// The stub OVERLAY (the mocked MapConfigurationDialog): publishes its draft
// layer stack to the host like the real overlay does.
const overlayWithDraft = <MapConfigurationDialog />;

// The map mock reports `load` (like a real mapbox map that is already
// loaded) so MapProvider picks the instance up. Map edit mode is NAMED at
// the call site (StoryMapForm passes `mapEditMode={Boolean(mapConfigTarget)}`)
// — StoryMap never infers it from the overlay's presence.
const setup = async ({ overlay, mapEditMode = false } = {}) => {
  const map = createLoadedMapMock();
  mapboxgl.Map.mockReturnValue(map);
  const utils = await render(
    <StoryMap
      config={CONFIG}
      mapEditMode={mapEditMode}
      mapConfigOverlay={overlay}
    />
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
    await setup({ overlay: overlayStub, mapEditMode: true });

    const features = document.getElementById('features');
    expect(features).toHaveStyle({ opacity: 0.2, pointerEvents: 'none' });
  });

  it('restores the chapter content after the overlay closes', async () => {
    const { rerender } = await setup({
      overlay: overlayStub,
      mapEditMode: true,
    });

    await act(async () => {
      rerender(<StoryMap config={CONFIG} mapEditMode={false} />);
    });

    const features = document.getElementById('features');
    expect(features).not.toHaveStyle({ opacity: 0.2 });
    expect(features).not.toHaveStyle({ pointerEvents: 'none' });
  });

  it('enables map interaction while open and restores it on close', async () => {
    const { rerender, map } = await setup({
      overlay: overlayStub,
      mapEditMode: true,
    });

    // Map interaction (drag/zoom) is on while the overlay is open…
    expect(map.dragPan.enable).toHaveBeenCalled();
    expect(document.getElementById('map')).toHaveStyle({
      pointerEvents: 'auto',
    });

    map.dragPan.disable.mockClear();
    await act(async () => {
      rerender(<StoryMap config={CONFIG} mapEditMode={false} />);
    });

    // …and restored to the editor's normal (non-interactive) state on close.
    expect(map.dragPan.disable).toHaveBeenCalled();
    expect(document.getElementById('map')).toHaveStyle({
      pointerEvents: 'none',
    });
  });

  it('swaps the layer mounts to the overlay draft stack while open and restores them after', async () => {
    const { rerender } = await setup({
      overlay: overlayWithDraft,
      mapEditMode: true,
    });

    // ONE mount point per mapbox layer id: while open, the mounts take their
    // dataset from the overlay's DRAFT (published by its stub) — the
    // config's own layers are never mounted alongside it.
    expect(screen.getByTestId('mock-layer-layer-draft')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-layer-layer-a')).not.toBeInTheDocument();

    await act(async () => {
      rerender(<StoryMap config={CONFIG} mapEditMode={false} />);
    });

    expect(screen.getByTestId('mock-layer-layer-a')).toBeInTheDocument();
    expect(
      screen.queryByTestId('mock-layer-layer-draft')
    ).not.toBeInTheDocument();
  });
});
