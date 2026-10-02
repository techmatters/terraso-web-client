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

import { Alert, Box, Stack } from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import { CompactAddControl } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CompactAddControl';
import { LayerDirectoryTree } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/LayerDirectoryTree';
import { MapLayerOrderList } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerOrderList';
import {
  MapLayerConfig,
  MapLayerDraftRow,
} from 'terraso-web-client/storyMap/storyMapTypes';

export const SIDEBAR_WIDTH = 300;

type MapLayersPanelProps = {
  /** Ordered rows, index 0 = topmost on the map. */
  rows: MapLayerDraftRow[];
  activeLayerIds: string[];
  /** All known layer configs (tree contents). */
  treeLayers: MapLayerConfig[];
  fetching: boolean;
  error: boolean;
  dropError: string | null;
  onDismissDropError: () => void;
  onFile: (file: File) => void;
  onReject: (file: File) => void;
  onToggleLayer: (layerId: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (layerId: string) => void;
};

/**
 * The map layers sidebar column: compact add control, reorderable order list
 * and the layer directory tree. Self-contained so the same panel can back the
 * dialog and a persistent (non-dialog) host.
 */
export const MapLayersPanel = ({
  rows,
  activeLayerIds,
  treeLayers,
  fetching,
  error,
  dropError,
  onDismissDropError,
  onFile,
  onReject,
  onToggleLayer,
  onReorder,
  onRemove,
}: MapLayersPanelProps) => {
  const { owner } = useCollaborationContext();

  return (
    <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
      <Stack spacing={2}>
        {dropError && (
          <Alert severity="error" onClose={onDismissDropError}>
            {dropError}
          </Alert>
        )}
        <CompactAddControl
          onFile={onFile}
          onReject={onReject}
          disabled={!owner}
        />
        <MapLayerOrderList
          rows={rows}
          onReorder={onReorder}
          onRemove={onRemove}
        />
        <LayerDirectoryTree
          mapLayers={treeLayers}
          activeLayerIds={activeLayerIds}
          fetching={fetching}
          error={error}
          onToggleLayer={onToggleLayer}
        />
      </Stack>
    </Box>
  );
};

export default MapLayersPanel;
