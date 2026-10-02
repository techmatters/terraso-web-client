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
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Portal,
  Stack,
  Typography,
} from '@mui/material';

import {
  CollaborationContextProvider,
  useCollaborationContext,
} from 'terraso-web-client/collaboration/collaborationContext';
import HelperText from 'terraso-web-client/common/components/HelperText';
import { useMap } from 'terraso-web-client/gis/components/Map';
import { MapboxStyle } from 'terraso-web-client/gis/components/MapboxConstants';
import MapControls from 'terraso-web-client/gis/components/MapControls';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';
import MapStyleSwitcher from 'terraso-web-client/gis/components/MapStyleSwitcher';
import { isValidBounds } from 'terraso-web-client/gis/gisUtils';
import { CreateMapLayerFileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CreateMapLayerDialog';
import {
  isMapLayerFileAccepted,
  mapLayerFileRejectionMessage,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/mapLayerFileDrop';
import {
  MapLayersPanel,
  SIDEBAR_WIDTH,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayersPanel';
import { useLayerDraft } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/useLayerDraft';
import {
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import TopBarContainer from 'terraso-web-client/storyMap/components/StoryMapForm/TopBarContainer';
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

const BearingIcon = () => {
  const { t } = useTranslation();
  return (
    <Paper
      alt={t('storyMap.form_location_helper_text_bearing_icon_alt')}
      variant="outlined"
      component="img"
      src="/storyMap/bearing-icon.svg"
      width={24}
      height={24}
      sx={{
        verticalAlign: 'middle',
      }}
    />
  );
};

const SetMapHelperText = () => {
  const { t } = useTranslation();
  return (
    <DialogContent>
      <Stack spacing={3}>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_1">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom>Paragraph 1</Typography>
            <img
              src="/storyMap/set-map-step-1.png"
              alt={t('storyMap.form_location_helper_text_step_1_image_alt')}
            />
          </Trans>
        </Box>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_2">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom sx={{ mb: 2 }}>
              Paragraph 1
            </Typography>
            <Typography gutterBottom>
              Content
              <BearingIcon />
              content
              <BearingIcon />
              content
            </Typography>
            <img
              src="/storyMap/set-map-step-2-1.png"
              alt={t('storyMap.form_location_helper_text_step_2_1_image_alt')}
            />
            <img
              src="/storyMap/set-map-step-2-2.png"
              alt={t('storyMap.form_location_helper_text_step_2_2_image_alt')}
            />
          </Trans>
        </Box>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_3">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom>Paragraph 1</Typography>
            <img
              src={t('storyMap.form_location_helper_text_step_3_image_src')}
              alt={t('storyMap.form_location_helper_text_step_3_image_alt')}
            />
          </Trans>
        </Box>
      </Stack>
    </DialogContent>
  );
};

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
    // The shared editor map is already loaded when the overlay opens (no
    // `load` event will fire), so record the starting camera right away.
    updatePosition();

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

  const { map, changeStyle } = useMap();

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

  // The overlay reuses the live editor map: place the shared camera at the
  // transition's starting position (the standalone dialog's initial map
  // view — the chapter's own location, or the closest previous one) before
  // the user starts dragging. Only once per map instance so later config
  // commits never yank the camera back mid-edit.
  const cameraInitializedRef = useRef(false);
  useEffect(() => {
    if (!map || cameraInitializedRef.current) {
      return;
    }
    cameraInitializedRef.current = true;
    const { center, zoom, pitch, bearing, bounds } = initialLocation ?? {};
    if (bounds && isValidBounds(bounds)) {
      map.fitBounds(bounds, { animate: false });
      return;
    }
    if (center) {
      map.jumpTo({
        center,
        zoom: zoom ?? 1,
        pitch: pitch ?? 0,
        bearing: bearing ?? 0,
      });
    }
  }, [map, initialLocation]);

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
    // Basemap changes are applied to the SHARED editor map live by the style
    // switcher (unlike the standalone dialog's throwaway map). Cancel discards
    // the whole draft — including the basemap — so restore the config style.
    if (mapStyle && mapStyle !== config.style) {
      changeStyle?.(config.style);
    }
    onClose();
  }, [onClose, mapStyle, config.style, changeStyle]);

  // Escape cancels the overlay (X close button = Cancel).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, handleCancel]);

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
      <Portal>
        <Box
          role="dialog"
          aria-labelledby="map-location-dialog-title"
          aria-describedby="map-location-dialog-content-text"
          data-testid="map-config-overlay"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.drawer + 1,
            display: 'flex',
            flexDirection: 'column',
            // Everything not covered by the bars/sidebars shows — and lets
            // the user drag — the live editor map underneath.
            pointerEvents: 'none',
          }}
        >
          <Box data-testid="map-config-top-bar" sx={{ pointerEvents: 'auto' }}>
            <TopBarContainer
              id="map-config-header"
              ariaLabel={t('storyMap.form_location_dialog_header_label')}
            >
              <Grid size={10} sx={{ pl: 2 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  id="map-location-dialog-title"
                  sx={{ pt: 0 }}
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
                </Typography>
              </Grid>
              <Grid
                size={2}
                sx={{
                  pr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <IconButton
                  aria-label={t('common.dialog_close_label')}
                  onClick={handleCancel}
                >
                  <CloseIcon />
                </IconButton>
              </Grid>
            </TopBarContainer>
          </Box>
          <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
            {/* Left sidebar: the invitation to drag the shared map (it covers
                the chapters list while the overlay is open). */}
            <Box
              data-testid="map-config-position-panel"
              sx={{
                width: 200,
                flexShrink: 0,
                bgcolor: 'white',
                overflowY: 'auto',
                p: 2,
                pointerEvents: 'auto',
              }}
            >
              <Typography variant="h3" gutterBottom>
                {t('storyMap.form_location_dialog_drag_title')}
              </Typography>
              <Typography
                id="map-location-dialog-content-text"
                variant="body2"
                sx={{ mb: 2 }}
              >
                {t('storyMap.form_location_dialog_drag_text')}
              </Typography>
              <HelperText
                showLabel
                maxWidth={586}
                label={t('storyMap.form_location_dialog_helper_text_label')}
                Component={SetMapHelperText}
                buttonProps={{
                  sx: { pl: 0, color: 'gray.dark1' },
                }}
              />
            </Box>
            {/* Transparent, click-through map window: the live editor map
                below is what gets dragged to set the chapter position. */}
            <Box
              data-testid="map-config-map-window"
              sx={{ flex: 1, pointerEvents: 'none' }}
            />
            {/* Right sidebar: the layers panel at the story map configuration
                right sidebar width. */}
            <Box
              data-testid="map-config-layers-panel"
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                bgcolor: 'white',
                overflowY: 'auto',
                p: 2,
                pointerEvents: 'auto',
              }}
            >
              <MapLayersPanel
                sx={{ width: '100%' }}
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
            </Box>
          </Stack>
          {/* Bottom bar: the large Save/Cancel action bar. */}
          <Stack
            data-testid="map-config-bottom-bar"
            direction="row"
            spacing={2}
            sx={{
              minHeight: 112,
              bgcolor: 'white',
              borderTop: '1px solid',
              borderColor: 'gray.lite1',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: 3,
              pointerEvents: 'auto',
            }}
          >
            <Button size="large" onClick={handleCancel}>
              {t('storyMap.location_dialog_cancel_button')}
            </Button>
            <Button size="large" onClick={handleConfirm} variant="contained">
              {t('storyMap.location_dialog_confirm_button')}
            </Button>
          </Stack>
          {dragActive && (
            <Box
              data-testid="window-drop-overlay"
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
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
        </Box>
      </Portal>
      {/* Map-scoped children: this component is hosted INSIDE the shared
          editor map (StoryMap renders it within its Map), so these controls
          attach to the live map instead of mounting a second one. */}
      <MapControls showCompass visualizePitch />
      <MapGeocoder position="top-right" />
      <MapStyleSwitcher position="top-right" onStyleChange={onStyleChange} />
      <MapLocationChange
        onPositionChange={handlePositionChange}
        programmaticMoveRef={programmaticMoveRef}
      />
      <MapLayerPreview
        mapLayerConfigs={draftMapLayerConfigs}
        changeBoundsLayerId={changeBoundsLayerId}
      />
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
