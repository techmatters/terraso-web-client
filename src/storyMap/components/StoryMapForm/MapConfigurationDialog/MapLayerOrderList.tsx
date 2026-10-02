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

import { useCallback } from 'react';
import {
  DragDropContext,
  Draggable,
  DroppableProvided,
  DropResult,
} from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';

import StrictModeDroppable from 'terraso-web-client/common/components/StrictModeDroppable';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

type MapLayerOrderListProps = {
  /** Ordered layer configs, index 0 = topmost on the map. */
  mapLayerConfigs: MapLayerConfig[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (layerId: string) => void;
};

/**
 * Reorderable list of the chapter's map layers. List order = map z-order,
 * top of the list = topmost layer. The whole row is draggable (except the X
 * icon, which removes the layer from the chapter).
 */
export const MapLayerOrderList = ({
  mapLayerConfigs,
  onReorder,
  onRemove,
}: MapLayerOrderListProps) => {
  const { t } = useTranslation();

  const handleDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!destination || destination.index === source.index) {
        return;
      }
      onReorder(source.index, destination.index);
    },
    [onReorder]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <StrictModeDroppable droppableId="map-layer-order">
        {(provided: DroppableProvided) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            component="ul"
            spacing={1}
            aria-label={t('storyMap.form_map_layers_list_label')}
            sx={{ p: 0, m: 0, listStyle: 'none' }}
          >
            {mapLayerConfigs.map((layerConfig, index) => (
              <Draggable
                key={layerConfig.id}
                draggableId={layerConfig.id}
                index={index}
              >
                {(dragProvided, snapshot) => (
                  <Paper
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    component="li"
                    aria-label={layerConfig.title}
                    variant="outlined"
                    sx={theme => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing(0.5),
                      p: theme.spacing(0.5, 1),
                      bgcolor: snapshot.isDragging ? 'blue.lite' : 'gray.lite2',
                    })}
                  >
                    {/* The whole row is draggable except the X icon. */}
                    <Box
                      {...dragProvided.dragHandleProps}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flexGrow: 1,
                        cursor: 'grab',
                      }}
                    >
                      <DragIndicatorIcon
                        fontSize="small"
                        aria-hidden="true"
                        sx={{ color: 'gray.dark1' }}
                      />
                      <Typography variant="body2">
                        {layerConfig.title}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      aria-label={t(
                        'storyMap.form_map_layers_item_remove_label',
                        {
                          title: layerConfig.title,
                        }
                      )}
                      // Keep the X out of the row's drag handle.
                      onMouseDown={event => event.stopPropagation()}
                      onClick={event => {
                        event.stopPropagation();
                        onRemove(layerConfig.id);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Stack>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
};

export default MapLayerOrderList;
