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

import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { StoryMapNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CollaborationContextProvider,
  useCollaborationContext,
} from 'terraso-web-client/collaboration/collaborationContext';
import HelperText from 'terraso-web-client/common/components/HelperText';
import Map, { useMap } from 'terraso-web-client/gis/components/Map';
import { MapboxStyle } from 'terraso-web-client/gis/components/MapboxConstants';
import MapControls from 'terraso-web-client/gis/components/MapControls';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';
import MapStyleSwitcher from 'terraso-web-client/gis/components/MapStyleSwitcher';
import { CreateMapLayerFileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/CreateMapLayerDialog';
import {
  isMapLayerFileAccepted,
  mapLayerFileRejectionMessage,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/mapLayerFileDrop';
import { MapLayersPanel } from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/MapLayersPanel';
import { SetMapHelperText } from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/SetMapHelperText';
import { useLayerDraft } from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/useLayerDraft';
import {
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import {
  addMapLayerId,
  moveMapLayerId,
  removeMapLayerId,
  resolveMapLayers,
  toMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import { enforceMapLayerOrder } from 'terraso-web-client/storyMap/mapUtils';
import {
  MapBounds,
  MapLayerConfig,
  MapLayerDraftRow,
  MapLayerTransition,
  MapPosition,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

type MapLocationChangeProps = {
  onPositionChange: (position: MapPosition) => void;
  /**
   * Programmatic map moves (chapter camera fits for added layers) must not be
   * recorded as user camera edits. While the counter is > 0, `move` updates
   * are skipped; it is cleared on `moveend` and on real user interaction
   * (pointer/wheel), so only genuinely user-driven moves are recorded.
   */
  programmaticMoveRef: MutableRefObject<number>;
};
const MapLocationChange = ({
  onPositionChange,
  programmaticMoveRef,
}: MapLocationChangeProps) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const updatePosition = () => {
      if (programmaticMoveRef.current > 0) {
        return;
      }
      onPositionChange({
        center: map.getCenter(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        bounds: _.flatten(map.getBounds().toArray()) as MapBounds,
      });
    };
    const endProgrammaticMove = () => {
      programmaticMoveRef.current = 0;
    };
    map.on('load', updatePosition);
    map.on('move', updatePosition);
    map.on('moveend', endProgrammaticMove);
    const userInteractionEvents = [
      'dragstart',
      'mousedown',
      'touchstart',
      'wheel',
    ];
    userInteractionEvents.forEach(event => map.on(event, endProgrammaticMove));

    return () => {
      map.off('load', updatePosition);
      map.off('move', updatePosition);
      map.off('moveend', endProgrammaticMove);
      userInteractionEvents.forEach(event =>
        map.off(event, endProgrammaticMove)
      );
    };
  }, [map, onPositionChange, programmaticMoveRef]);

  return null;
};

/**
 * Renders the draft layers on the preview map (topmost first) and keeps the
 * mapbox z-order in sync with the draft order.
 */
const MapLayerPreview = ({
  mapLayerConfigs,
  changeBoundsLayerId,
}: {
  mapLayerConfigs: MapLayerConfig[];
  changeBoundsLayerId?: string;
}) => {
  const { map } = useMap();
  const [layerRevision, setLayerRevision] = useState(0);

  const onLayerAdded = useCallback(() => {
    setLayerRevision(revision => revision + 1);
  }, []);

  const mapLayers = useMemo<MapLayerTransition[]>(
    () => mapLayerConfigs.map(({ id }) => ({ layerId: id })),
    [mapLayerConfigs]
  );

  useEffect(() => {
    if (map) {
      enforceMapLayerOrder(map, mapLayers);
    }
  }, [map, mapLayers, layerRevision]);

  return (
    <>
      {mapLayerConfigs.map(mapLayerConfig => (
        <StoryMapLayer
          key={mapLayerConfig.id}
          config={mapLayerConfig}
          useConfigBounds
          changeBounds={mapLayerConfig.id === changeBoundsLayerId}
          avoidMoveWhenVisible
          onLayerAdded={onLayerAdded}
        />
      ))}
    </>
  );
};

export type MapConfigurationConfirm = {
  location: MapPosition;
  mapStyle: string;
  /**
   * Ordered layer rows, index 0 = topmost on the map. Writes back ALL
   * layerIds — including rows whose config resolves nowhere (unknown refs are
   * preserved). Compat fields are derived from `mapLayers` at the config
   * write boundary; this payload carries no compat knowledge.
   */
  mapLayerRows: MapLayerDraftRow[];
};

type MapConfigurationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (_: MapConfigurationConfirm) => void;
  location?: MapPosition;
  title?: string;
  chapterId?: string;
  /** Chapter/titleTransition `mapLayers` (legacy chapters pass undefined). */
  mapLayers?: MapLayerTransition[];
  /** Chapter/titleTransition `dataLayerConfigId`. */
  dataLayerConfigId?: string;
};
export const MapConfigurationDialog = (props: MapConfigurationDialogProps) => {
  const { t } = useTranslation();
  const { config, storyMap } = useStoryMapConfigDataContext() as {
    config: StoryMapConfig;
    storyMap: StoryMapNode;
  };
  const { setConfig, registerSessionDataLayers } =
    useStoryMapConfigActionsContext();
  const { open, onClose, onConfirm, location, title, chapterId } = props;

  // Programmatic-fit suppression for camera recording (see MapLocationChange).
  const programmaticMoveRef = useRef(0);
  const beginProgrammaticMove = useCallback(() => {
    programmaticMoveRef.current += 1;
  }, []);

  const [mapCenter, setMapCenter] = useState(location?.center);
  const [mapZoom, setMapZoom] = useState(location?.zoom);
  const [mapPitch, setMapPitch] = useState(location?.pitch);
  const [mapBearing, setMapBearing] = useState(location?.bearing);
  const [mapBounds, setMapBounds] = useState(location?.bounds);
  const [mapStyle, setMapStyle] = useState<string | undefined>();
  const [changeBoundsLayerId, setChangeBoundsLayerId] = useState<
    string | undefined
  >();

  const mapRef = useRef(null);

  const user = useSelector((state: any) => state.account.currentUser);

  // Draft layer state + layer index fetch (useLayerDraft keeps the fetch
  // wiring host-agnostic — a persistent host passes fetchEnabled=true). The
  // draft is an ordered layer id list, index 0 topmost; it is only written
  // back to the config on confirm — except layers created through the create
  // flow, which are committed immediately (see onCreateLayer). The draft
  // knows nothing about the compat fields.
  const {
    draftLayerIds,
    setDraftLayerIds,
    draftRows,
    draftMapLayerConfigs,
    layerConfigsById,
    resolveLayerConfig,
    fetching,
    error,
  } = useLayerDraft({
    storyMapId: storyMap?.id,
    email: user?.data?.email,
    fetchEnabled: open,
    mapLayers: props.mapLayers,
    dataLayerConfigId: props.dataLayerConfigId,
    dataLayers: config.dataLayers,
  });

  const initialLocation = useMemo(() => {
    if (location) {
      return location;
    }

    if (chapterId) {
      const currentIndex = config.chapters.findIndex(c => c.id === chapterId);
      const chapterWithLocation = config.chapters
        .slice(0, currentIndex + 1)
        .reverse()
        .find(c => c.location);

      if (chapterWithLocation) {
        return chapterWithLocation?.location;
      }
    }

    if (config.titleTransition?.location) {
      return config.titleTransition?.location;
    }

    const firstChapterWithLocation = config.chapters.find(
      chapter => chapter.location
    );
    return firstChapterWithLocation?.location;
  }, [location, config.chapters, config.titleTransition?.location, chapterId]);

  const handleConfirm = useCallback(() => {
    const location = _.omitBy(_.isNil, {
      center: mapCenter,
      zoom: mapZoom,
      pitch: mapPitch,
      bearing: mapBearing,
      bounds: mapBounds,
    }) as MapPosition;
    onConfirm({
      location,
      mapStyle: mapStyle || config.style,
      mapLayerRows: draftRows,
    });
  }, [
    onConfirm,
    mapCenter,
    mapZoom,
    mapPitch,
    mapBearing,
    mapBounds,
    mapStyle,
    config.style,
    draftRows,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePositionChange = useCallback((position: MapPosition) => {
    setMapCenter(position.center);
    setMapZoom(position.zoom);
    setMapPitch(position.pitch);
    setMapBearing(position.bearing);
    setMapBounds(position.bounds);
  }, []);

  const onStyleChange = useCallback(
    ({ newStyle }: { newStyle: MapboxStyle }) => {
      setMapStyle(newStyle.data);
    },
    []
  );

  const onToggleLayer = useCallback(
    (layerId: string) => {
      const isOn = draftLayerIds.includes(layerId);
      if (isOn) {
        setDraftLayerIds(current => removeMapLayerId(current, layerId));
        return;
      }
      if (!resolveLayerConfig(layerId)) {
        return;
      }
      // The preview fits the added layer — a programmatic move that must not
      // rewrite the chapter camera.
      beginProgrammaticMove();
      setChangeBoundsLayerId(layerId);
      setDraftLayerIds(current => addMapLayerId(current, layerId));
    },
    [draftLayerIds, resolveLayerConfig, beginProgrammaticMove, setDraftLayerIds]
  );

  const onRemoveLayer = useCallback(
    (layerId: string) => {
      setDraftLayerIds(current => removeMapLayerId(current, layerId));
    },
    [setDraftLayerIds]
  );

  const onReorder = useCallback(
    (sourceIndex: number, destIndex: number) => {
      setDraftLayerIds(current =>
        moveMapLayerId(current, sourceIndex, destIndex)
      );
    },
    [setDraftLayerIds]
  );

  /**
   * COMMIT CONTRACT (product spec): a layer created through the create flow
   * is committed to the config IMMEDIATELY — its payload goes into
   * `dataLayers` and its id is prepended onto the target transition's
   * `mapLayers` — so it survives a later dialog Cancel. Only `mapLayers` +
   * `dataLayers` are written; the compat fields (dataLayerConfigId,
   * onChapterEnter/onChapterExit) are derived from them at the config write
   * boundary. Removing the layer from the chapter and saving only DETACHES
   * it: the created asset is registered as session-created (exempt from
   * save-time pruning) and appended to the fetched layer list, so it stays
   * available in the tree and re-toggling it re-adds its payload to
   * `dataLayers` — it is never destroyed.
   */
  const onCreateLayer = useCallback(
    (mapLayerConfig: MapLayerConfig) => {
      registerSessionDataLayers([mapLayerConfig.id]);
      setConfig((currentConfig: StoryMapConfig) => {
        const applyAdd = (transition?: Transition) => ({
          ...transition,
          mapLayers: toMapLayers(
            addMapLayerId(
              resolveMapLayers(transition).map(({ layerId }) => layerId),
              mapLayerConfig.id
            )
          ),
        });

        return {
          ...currentConfig,
          dataLayers: {
            ...currentConfig.dataLayers,
            [mapLayerConfig.id]: mapLayerConfig,
          },
          ...(chapterId
            ? {
                chapters: currentConfig.chapters.map(chapter =>
                  chapter.id === chapterId ? applyAdd(chapter) : chapter
                ),
              }
            : { titleTransition: applyAdd(currentConfig.titleTransition) }),
        };
      });
      beginProgrammaticMove();
      setChangeBoundsLayerId(mapLayerConfig.id);
      setDraftLayerIds(current => addMapLayerId(current, mapLayerConfig.id));
    },
    [
      setConfig,
      registerSessionDataLayers,
      chapterId,
      beginProgrammaticMove,
      setDraftLayerIds,
    ]
  );

  // While the dialog is open, the whole window accepts file drops to start
  // the create-new-layer flow preloaded with the dropped file.
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // True while CreateMapLayerDialog is open: window drops must never swap the
  // file mid-form.
  const [createFlowActive, setCreateFlowActive] = useState(false);
  const startCreateFlow = useCallback(
    (file: File) => {
      if (createFlowActive) {
        return;
      }
      setDropError(null);
      setPendingFile(file);
    },
    [createFlowActive]
  );
  const onRejectFile = useCallback(
    (file: File) => {
      setDropError(mapLayerFileRejectionMessage(file, t));
    },
    [t]
  );
  useEffect(() => {
    if (!open) {
      return;
    }
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        setDragActive(true);
      }
    };
    const onDragLeave = (event: DragEvent) => {
      // Inner dragleave events fire for every element crossed; only leaving
      // the window (no relatedTarget) cancels the affordance.
      if (!event.relatedTarget) {
        setDragActive(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      setDragActive(false);
      const files = event.dataTransfer?.files;
      if (!files?.length) {
        return;
      }
      event.preventDefault();
      if (createFlowActive) {
        // The create dialog is open: ignore the drop entirely (no file swap).
        return;
      }
      // Multi-file drop: take the first file and ignore the rest.
      const file = files[0];
      if (isMapLayerFileAccepted(file)) {
        startCreateFlow(file);
      } else {
        onRejectFile(file);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [open, startCreateFlow, onRejectFile, createFlowActive]);

  return (
    <CollaborationContextProvider owner={storyMap} entityType="story_map">
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="map-location-dialog-title"
        aria-describedby="map-location-dialog-content-text"
        maxWidth={false}
        fullWidth
        slotProps={{
          paper: {
            sx: {
              // Fill (most of) the available viewport height; the map and the
              // layer sidebar share this height and scroll independently.
              height: '90vh',
              maxHeight: 'none',
            },
          },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Stack>
            <DialogTitle
              component="h1"
              id="map-location-dialog-title"
              sx={{ pb: 0 }}
            >
              {title ? (
                <Trans
                  i18nKey="storyMap.form_location_dialog_title"
                  values={{ title: title }}
                >
                  prefix
                  <i>italic</i>
                </Trans>
              ) : (
                <>{t('storyMap.form_location_dialog_title_blank')}</>
              )}
            </DialogTitle>
            <DialogContent sx={{ pb: 0 }}>
              <HelperText
                showLabel
                maxWidth={586}
                label={t('storyMap.form_location_dialog_helper_text_label')}
                Component={SetMapHelperText}
                buttonProps={{
                  sx: { pl: 0, color: 'gray.dark1' },
                }}
              />
            </DialogContent>
          </Stack>
          <DialogActions sx={{ pr: 3 }}>
            <Button size="small" onClick={handleCancel}>
              {t('storyMap.location_dialog_cancel_button')}
            </Button>
            <Button size="small" onClick={handleConfirm} variant="contained">
              {t('storyMap.location_dialog_confirm_button')}
            </Button>
          </DialogActions>
        </Stack>

        <DialogContent sx={{ overflow: 'hidden' }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: 'stretch',
              position: 'relative',
              height: '100%',
              minHeight: 0,
            }}
          >
            {dragActive && (
              <Box
                data-testid="window-drop-overlay"
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: theme => theme.zIndex.modal + 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  border: '3px dashed',
                  borderColor: 'blue.dark',
                  bgcolor: 'blue.lite',
                }}
              >
                <Typography variant="h3">
                  {t('storyMap.form_map_layers_add_drop_text')}
                </Typography>
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <Map
                ref={mapRef}
                use3dTerrain
                height="100%"
                initialLocation={initialLocation}
                projection={config.projection}
                mapStyle={config.style}
              >
                <MapControls showCompass visualizePitch />
                <MapGeocoder position="top-right" />
                <MapStyleSwitcher
                  position="top-right"
                  onStyleChange={onStyleChange}
                />
                <MapLocationChange
                  onPositionChange={handlePositionChange}
                  programmaticMoveRef={programmaticMoveRef}
                />
                <MapLayerPreview
                  mapLayerConfigs={draftMapLayerConfigs}
                  changeBoundsLayerId={changeBoundsLayerId}
                />
              </Map>
            </Box>
            <MapLayersPanel
              rows={draftRows}
              activeLayerIds={draftLayerIds}
              treeLayers={Object.values(layerConfigsById)}
              fetching={fetching}
              error={error}
              dropError={dropError}
              onDismissDropError={() => setDropError(null)}
              onFile={startCreateFlow}
              onReject={onRejectFile}
              onToggleLayer={onToggleLayer}
              onReorder={onReorder}
              onRemove={onRemoveLayer}
            />
          </Stack>
        </DialogContent>
      </Dialog>
      <CreateMapLayerFileUpload
        title={title}
        onCreate={onCreateLayer}
        externalFile={pendingFile}
        showDropZone={false}
        onCreateDialogOpenChange={setCreateFlowActive}
      />
    </CollaborationContextProvider>
  );
};
