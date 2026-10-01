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

describe('DirectoryTree (generic)', () => {
  const nodes = [
    {
      id: 'root-a',
      label: 'Root A',
      children: [
        { id: 'child-a1', label: 'Child A1' },
        { id: 'child-a2', label: 'Child A2' },
      ],
    },
    { id: 'leaf-b', label: 'Leaf B' },
  ];

  test('renders nodes and their children with tree roles', async () => {
    await render(<DirectoryTree aria-label="Tree" nodes={nodes} />);

    expect(screen.getByRole('tree', { name: 'Tree' })).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Root A' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Child A1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Leaf B' })
    ).toBeInTheDocument();
    // branch rows expose expanded state
    expect(screen.getByRole('treeitem', { name: 'Root A' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('hides children of collapsed branches', async () => {
    await render(
      <DirectoryTree aria-label="Tree" nodes={nodes} defaultExpandedIds={[]} />
    );

    expect(screen.getByRole('treeitem', { name: 'Root A' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(
      screen.queryByRole('treeitem', { name: 'Child A1' })
    ).not.toBeInTheDocument();
  });

  test('calls onNodeClick with the node id', async () => {
    const onNodeClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={nodes}
        onNodeClick={onNodeClick}
      />
    );

    fireEvent.click(screen.getByRole('treeitem', { name: 'Leaf B' }));
    expect(onNodeClick).toHaveBeenCalledWith('leaf-b');
  });

  test('calls onActionClick with the node id without firing onNodeClick', async () => {
    const onNodeClick = jest.fn();
    const onActionClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={[
          {
            id: 'layer-1',
            label: 'Layer 1',
            action: { label: 'Toggle layer', icon: <span>eye</span> },
          },
        ]}
        onNodeClick={onNodeClick}
        onActionClick={onActionClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle layer' }));
    expect(onActionClick).toHaveBeenCalledWith('layer-1');
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  test('reflects the on/off state of a node on its row and action', async () => {
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={[
          {
            id: 'layer-1',
            label: 'Layer 1',
            active: true,
            action: { label: 'Toggle layer', icon: <span>eye</span> },
          },
          {
            id: 'layer-2',
            label: 'Layer 2',
            active: false,
            action: { label: 'Toggle layer 2', icon: <span>eye</span> },
          },
        ]}
      />
    );

    expect(screen.getByRole('treeitem', { name: 'Layer 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('button', { name: 'Toggle layer' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('treeitem', { name: 'Layer 2' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    expect(
      screen.getByRole('button', { name: 'Toggle layer 2' })
    ).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('DirectoryTree (story map layer tree)', () => {
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
    const onNodeClick = jest.fn();
    const onActionClick = jest.fn();
    await renderTree({ onNodeClick, onActionClick });

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
});
