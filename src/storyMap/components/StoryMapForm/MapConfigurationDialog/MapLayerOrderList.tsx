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
import { MapLayerDraftRow } from 'terraso-web-client/storyMap/storyMapTypes';

type MapLayerOrderListProps = {
  /** Ordered rows, index 0 = topmost on the map. */
  rows: MapLayerDraftRow[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (layerId: string) => void;
};

/**
 * Reorderable list of the chapter's map layers. List order = map z-order,
 * top of the list = topmost layer. The whole row is draggable (except the X
 * icon, which removes the layer from the chapter). Rows whose layer ref
 * resolves nowhere render as an unknown/missing layer but stay reorderable
 * and removable — unknown data is never silently dropped.
 */
export const MapLayerOrderList = ({
  rows,
  onReorder,
  onRemove,
}: MapLayerOrderListProps) => {
  const { t } = useTranslation();

  const handleDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      // Drag cancelled or dropped at the same index: no-op (never splice).
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
            {rows.map(({ layerId, config }, index) => {
              const title =
                config?.title ??
                t('storyMap.form_map_layers_item_unknown_label');
              return (
                <Draggable key={layerId} draggableId={layerId} index={index}>
                  {(dragProvided, snapshot) => (
                    <Paper
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      component="li"
                      aria-label={title}
                      variant="outlined"
                      sx={theme => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing(0.5),
                        p: theme.spacing(0.5, 1),
                        bgcolor: snapshot.isDragging
                          ? 'blue.lite'
                          : 'gray.lite2',
                      })}
                    >
                      {/* The whole row is draggable except the X icon. */}
                      <Box
                        {...dragProvided.dragHandleProps}
                        aria-label={t(
                          'storyMap.form_map_layers_item_drag_label',
                          { title }
                        )}
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
                        <Typography variant="body2">{title}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        aria-label={t(
                          'storyMap.form_map_layers_item_remove_label',
                          {
                            title,
                          }
                        )}
                        // Keep the X out of the row's drag handle.
                        onMouseDown={event => event.stopPropagation()}
                        onClick={event => {
                          event.stopPropagation();
                          onRemove(layerId);
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </Stack>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
};

export default MapLayerOrderList;
