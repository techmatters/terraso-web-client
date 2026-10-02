/*
 * Copyright © 2025 Technology Matters
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

import { fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import { useTranslation } from 'react-i18next';

import DirectoryTree from 'terraso-web-client/common/components/DirectoryTree';
import {
  buildMapLayerTree,
  mapLayerTreeToDirectoryNodes,
} from 'terraso-web-client/storyMap/mapLayerTree';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

const makeLayer = (
  id: string,
  title: string,
  owner: {
    ownerType?: MapLayerConfig['ownerType'];
    ownerId?: string;
    ownerName?: string;
  } = {}
): MapLayerConfig =>
  ({
    id,
    title,
    ownerType: 'StoryMapNode',
    ...owner,
  }) as unknown as MapLayerConfig;

describe('map layer tree', () => {
  const mapLayers = [
    makeLayer('z-layer', 'Zebra', {
      ownerType: 'LandscapeNode',
      ownerId: 'landscape-b',
      ownerName: 'Beta Landscape',
    }),
    makeLayer('b-layer', 'alpha', {
      ownerType: 'LandscapeNode',
      ownerId: 'landscape-b',
      ownerName: 'Beta Landscape',
    }),
    makeLayer('g-layer', 'Group Layer', {
      ownerType: 'GroupNode',
      ownerId: 'group-a',
      ownerName: 'Alpha Group',
    }),
    makeLayer('story-2', 'Second Layer'),
    makeLayer('story-1', 'first layer'),
    makeLayer('a-layer', 'Only Layer', {
      ownerType: 'LandscapeNode',
      ownerId: 'landscape-a',
      ownerName: 'Alpha Landscape',
    }),
    makeLayer('g2-layer', 'Another Group Layer', {
      ownerType: 'GroupNode',
      ownerId: 'group-b',
      ownerName: 'Beta Group',
    }),
  ];

  const renderTree = async ({
    layers = mapLayers,
    hasGroups = true,
    hasLandscapes = true,
    activeLayerIds = [],
    onNodeClick = jest.fn(),
    onActionClick = jest.fn(),
  }: {
    layers?: MapLayerConfig[];
    hasGroups?: boolean;
    hasLandscapes?: boolean;
    activeLayerIds?: string[];
    onNodeClick?: (nodeId: string) => void;
    onActionClick?: (nodeId: string) => void;
  } = {}) => {
    const Tree = () => {
      const { t } = useTranslation();
      return (
        <DirectoryTree
          aria-label="Layer tree"
          nodes={mapLayerTreeToDirectoryNodes({
            sections: buildMapLayerTree({
              mapLayers: layers,
              hasGroups,
              hasLandscapes,
            }),
            activeLayerIds,
            t,
          })}
          onNodeClick={onNodeClick}
          onActionClick={onActionClick}
        />
      );
    };
    await render(<Tree />);
    return { onNodeClick, onActionClick };
  };

  test('renders the three sections', async () => {
    await renderTree();

    expect(
      screen.getByRole('treeitem', { name: 'This story map' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Landscapes' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Groups' })
    ).toBeInTheDocument();
  });

  test('hides landscapes and groups with zero layers', async () => {
    await renderTree({
      layers: mapLayers.filter(layer => layer.ownerId !== 'landscape-a'),
    });

    expect(
      screen.queryByRole('treeitem', { name: 'Alpha Landscape' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Beta Landscape' })
    ).toBeInTheDocument();
  });

  test('hides the landscapes and groups sections when the user is not a member', async () => {
    await renderTree({ hasGroups: false, hasLandscapes: false });

    expect(
      screen.queryByRole('treeitem', { name: 'Landscapes' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('treeitem', { name: 'Groups' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'This story map' })
    ).toBeInTheDocument();
  });

  test('builds sections in order: this story map, landscapes, groups', () => {
    const sections = buildMapLayerTree({
      mapLayers,
      hasGroups: true,
      hasLandscapes: true,
    });

    expect(sections.map(section => section.key)).toEqual([
      'STORY_MAP',
      'LANDSCAPE',
      'GROUP',
    ]);
  });

  test('sorts layers by lowercase title and owners alphabetically', () => {
    const sections = buildMapLayerTree({
      mapLayers,
      hasGroups: true,
      hasLandscapes: true,
    });
    const byKey = (key: string) =>
      sections.find(section => section.key === key);

    expect(byKey('STORY_MAP')?.layers.map(layer => layer.title)).toEqual([
      'first layer',
      'Second Layer',
    ]);

    expect(byKey('LANDSCAPE')?.groups.map(group => group.name)).toEqual([
      'Alpha Landscape',
      'Beta Landscape',
    ]);
    expect(
      byKey('LANDSCAPE')?.groups[1].layers.map(layer => layer.title)
    ).toEqual(['alpha', 'Zebra']);

    expect(byKey('GROUP')?.groups.map(group => group.name)).toEqual([
      'Alpha Group',
      'Beta Group',
    ]);
  });

  test('layer rows toggle via row click and via the eye action', async () => {
    const { onNodeClick, onActionClick } = await renderTree();

    fireEvent.click(screen.getByRole('treeitem', { name: 'first layer' }));
    expect(onNodeClick).toHaveBeenCalledWith('story-1');

    fireEvent.click(
      screen.getByRole('button', { name: 'Show or hide first layer' })
    );
    expect(onActionClick).toHaveBeenCalledWith('story-1');
  });

  test('shows layers in the chapter as on', async () => {
    await renderTree({ activeLayerIds: ['story-1'] });

    expect(
      screen.getByRole('treeitem', { name: 'first layer' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('button', { name: 'Show or hide first layer' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('treeitem', { name: 'Second Layer' })
    ).toHaveAttribute('aria-selected', 'false');
  });

  test('shows the empty copy for empty sections (LANDSCAPE included)', async () => {
    await renderTree({ layers: [] });

    expect(
      screen.getByText(
        "This story map doesn't contain any map layers yet. Upload a new file above or select a layer from your groups or landscapes."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('No maps have been made in your landscapes yet.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No maps have been made in your groups yet.')
    ).toBeInTheDocument();
  });

  test('clicking a disabled empty row is a no-op', async () => {
    const { onNodeClick, onActionClick } = await renderTree({ layers: [] });

    const emptyRow = screen.getByRole('treeitem', {
      name: /No maps have been made in your landscapes yet/,
    });
    fireEvent.click(emptyRow);

    expect(onNodeClick).not.toHaveBeenCalled();
    expect(onActionClick).not.toHaveBeenCalled();
  });

  test('clicking a branch row collapses and expands it and fires onNodeClick', async () => {
    const { onNodeClick } = await renderTree();

    const branch = screen.getByRole('treeitem', { name: 'Beta Landscape' });
    expect(branch).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(branch);
    expect(branch).toHaveAttribute('aria-expanded', 'false');
    expect(onNodeClick).toHaveBeenCalledWith('group:LANDSCAPE:landscape-b');

    fireEvent.click(branch);
    expect(branch).toHaveAttribute('aria-expanded', 'true');
    expect(onNodeClick).toHaveBeenCalledTimes(2);
  });

  test('layers without owner metadata default to the this story map section', () => {
    const sections = buildMapLayerTree({
      mapLayers: [
        makeLayer('orphan-landscape', 'Orphan Landscape', {
          ownerType: 'LandscapeNode',
        }),
        makeLayer('orphan-group', 'Orphan Group', {
          ownerType: 'GroupNode',
        }),
        makeLayer('story', 'Story Layer'),
      ],
      hasGroups: true,
      hasLandscapes: true,
    });

    // No phantom id:''/name:'' owner group: they file under this story map
    // (sorted by lowercase title).
    expect(
      sections
        .find(section => section.key === 'STORY_MAP')
        ?.layers.map(layer => layer.id)
    ).toEqual(['orphan-group', 'orphan-landscape', 'story']);
    expect(
      sections.find(section => section.key === 'LANDSCAPE')?.groups
    ).toEqual([]);
    expect(sections.find(section => section.key === 'GROUP')?.groups).toEqual(
      []
    );
  });
});
