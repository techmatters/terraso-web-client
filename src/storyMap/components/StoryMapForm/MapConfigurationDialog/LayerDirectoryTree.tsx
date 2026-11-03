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

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import { Box, CircularProgress, Typography } from '@mui/material';

import DirectoryTree from 'terraso-web-client/common/components/DirectoryTree';
import {
  buildMapLayerTree,
  mapLayerTreeToDirectoryNodes,
} from 'terraso-web-client/storyMap/mapLayerTree';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

type LayerDirectoryTreeProps = {
  mapLayers: MapLayerConfig[];
  activeLayerIds: string[];
  fetching: boolean;
  error: boolean;
  onToggleLayer: (layerId: string) => void;
};

/**
 * Directory tree of the user's map layers (this story map / landscapes /
 * groups) with per-row eye toggles.
 */
export const LayerDirectoryTree = ({
  mapLayers,
  activeLayerIds,
  fetching,
  error,
  onToggleLayer,
}: LayerDirectoryTreeProps) => {
  const { t } = useTranslation();
  const { hasGroups, hasLandscapes } = useSelector(
    (state: any) => state.storyMap.dataLayers
  ) as { hasGroups: boolean; hasLandscapes: boolean };

  const nodes = useMemo(
    () =>
      mapLayerTreeToDirectoryNodes({
        sections: buildMapLayerTree({ mapLayers, hasGroups, hasLandscapes }),
        activeLayerIds,
        t,
      }),
    [mapLayers, hasGroups, hasLandscapes, activeLayerIds, t]
  );

  const onNodeClick = useCallback(
    (nodeId: string) => {
      if (mapLayers.some(({ id }) => id === nodeId)) {
        onToggleLayer(nodeId);
      }
    },
    [mapLayers, onToggleLayer]
  );

  if (fetching && mapLayers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <CircularProgress aria-label={t('common.loader_label')} />
      </Box>
    );
  }

  if (error && !fetching) {
    return (
      <Typography>
        {t('storyMap.form_location_add_data_layer_dialog_load_error')}
      </Typography>
    );
  }

  return (
    <DirectoryTree
      aria-label={t('storyMap.form_map_layers_tree_label')}
      nodes={nodes}
      onNodeClick={onNodeClick}
      onActionClick={onToggleLayer}
    />
  );
};

export default LayerDirectoryTree;
