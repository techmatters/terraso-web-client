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

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import type { DirectoryTreeNode } from 'terraso-web-client/common/components/DirectoryTree';
import type { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

export type MapLayerTreeGroup = {
  id: string;
  name: string;
  layers: MapLayerConfig[];
};

export type MapLayerTreeSectionKey = 'STORY_MAP' | 'LANDSCAPE' | 'GROUP';

export type MapLayerTreeSection = {
  key: MapLayerTreeSectionKey;
  /** Flat layer list (STORY_MAP section only). */
  layers: MapLayerConfig[];
  /** Owner groups (LANDSCAPE/GROUP sections only), sorted by name. */
  groups: MapLayerTreeGroup[];
};

const SECTION_LABEL_KEYS: Record<MapLayerTreeSectionKey, string> = {
  STORY_MAP: 'storyMap.form_map_layers_tree_root_story_map',
  LANDSCAPE: 'storyMap.form_map_layers_tree_root_landscapes',
  GROUP: 'storyMap.form_map_layers_tree_root_groups',
};

const compareLowercase = (left: string, right: string) => {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

const sortLayers = (layers: MapLayerConfig[]) =>
  [...layers].sort((left, right) =>
    compareLowercase(left.title ?? '', right.title ?? '')
  );

const buildGroups = (layers: MapLayerConfig[]): MapLayerTreeGroup[] => {
  const groupsById = new Map<string, MapLayerTreeGroup>();
  sortLayers(layers).forEach(layer => {
    const id = layer.ownerId ?? '';
    const group = groupsById.get(id) ?? {
      id,
      name: layer.ownerName ?? '',
      layers: [],
    };
    group.layers.push(layer);
    groupsById.set(id, group);
  });

  // Landscapes/groups with zero layers are hidden.
  return [...groupsById.values()]
    .filter(group => group.layers.length > 0)
    .sort((left, right) => compareLowercase(left.name, right.name));
};

const layersByOwnerType = (
  mapLayers: MapLayerConfig[],
  ownerType: MapLayerConfig['ownerType']
) => mapLayers.filter(layer => layer.ownerType === ownerType);

export const buildMapLayerTree = ({
  mapLayers,
  hasGroups,
  hasLandscapes,
}: {
  mapLayers: MapLayerConfig[];
  hasGroups: boolean;
  hasLandscapes: boolean;
}): MapLayerTreeSection[] => {
  const sections: MapLayerTreeSection[] = [
    {
      key: 'STORY_MAP',
      layers: sortLayers(layersByOwnerType(mapLayers, 'StoryMapNode')),
      groups: [],
    },
  ];

  if (hasLandscapes) {
    sections.push({
      key: 'LANDSCAPE',
      layers: [],
      groups: buildGroups(layersByOwnerType(mapLayers, 'LandscapeNode')),
    });
  }

  if (hasGroups) {
    sections.push({
      key: 'GROUP',
      layers: [],
      groups: buildGroups(layersByOwnerType(mapLayers, 'GroupNode')),
    });
  }

  return sections;
};

export const mapLayerTreeToDirectoryNodes = ({
  sections,
  activeLayerIds,
  t,
}: {
  sections: MapLayerTreeSection[];
  activeLayerIds: string[];
  t: (key: string, options?: Record<string, unknown>) => string;
}): DirectoryTreeNode[] => {
  const activeIds = new Set(activeLayerIds);

  const layerNode = (layer: MapLayerConfig): DirectoryTreeNode => {
    const active = activeIds.has(layer.id);
    return {
      id: layer.id,
      label: layer.title,
      active,
      action: {
        label: t('storyMap.form_map_layers_tree_toggle_label', {
          title: layer.title,
        }),
        icon: active ? <VisibilityIcon /> : <VisibilityOffIcon />,
      },
    };
  };

  return sections.map(section => {
    const emptyLabelKey = `storyMap.form_location_add_data_layer_dialog_select_tab_empty.${section.key}`;
    const children: DirectoryTreeNode[] =
      section.key === 'STORY_MAP'
        ? section.layers.map(layerNode)
        : section.groups.map(group => ({
            id: `group:${section.key}:${group.id}`,
            label: group.name,
            children: group.layers.map(layerNode),
          }));

    if (children.length === 0) {
      children.push({
        id: `empty:${section.key}`,
        label: t(emptyLabelKey),
        disabled: true,
      });
    }

    return {
      id: `section:${section.key}`,
      label: t(SECTION_LABEL_KEYS[section.key]),
      children,
    };
  });
};
