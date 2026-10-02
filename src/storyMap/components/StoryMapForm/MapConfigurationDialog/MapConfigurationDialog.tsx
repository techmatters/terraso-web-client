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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { StoryMapNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import {
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
import Map from 'terraso-web-client/gis/components/Map';
import { MapboxStyle } from 'terraso-web-client/gis/components/MapboxConstants';
import MapControls from 'terraso-web-client/gis/components/MapControls';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';
import MapStyleSwitcher from 'terraso-web-client/gis/components/MapStyleSwitcher';
import {
  MapLayerCreateSessionProvider,
  useMapLayerCreateFlow,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import {
  MapLayerPreview,
  MapLocationChange,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateStage';
import { MapLayerCreateSteps } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSteps';
import {
  MapLayersPanel,
  SIDEBAR_WIDTH,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayersPanel';
import { useLayerDraft } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/useLayerDraft';
import {
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  addCreatedMapLayerToConfig,
  addMapLayerId,
  moveMapLayerId,
  removeMapLayerId,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import {
  MapBounds,
  MapLayerConfig,
  MapLayerDraftRow,
  MapLayerTransition,
  MapPosition,
  StoryMapConfig,
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

  const [mapCenter, setMapCenter] = useState(location?.center);
  const [mapZoom, setMapZoom] = useState(location?.zoom);
  const [mapPitch, setMapPitch] = useState(location?.pitch);
  const [mapBearing, setMapBearing] = useState(location?.bearing);
  const [mapBounds, setMapBounds] = useState(location?.bounds);
  const [mapStyle, setMapStyle] = useState<string | undefined>();
  const [changeBoundsLayerId, setChangeBoundsLayerId] = useState<
    string | undefined
  >();

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

  /**
   * COMMIT CONTRACT (product spec): a layer created through the create flow
   * is committed to the config IMMEDIATELY (see `addCreatedMapLayerToConfig`)
   * so it survives a later dialog Cancel. Only `mapLayers` + `dataLayers` are
   * written; the compat fields are derived from them at the config write
   * boundary. The created asset is registered as session-created (exempt from
   * save-time pruning) and the draft shows it right away.
   */
  const onCreateLayer = useCallback(
    (mapLayerConfig: MapLayerConfig) => {
      registerSessionDataLayers([mapLayerConfig.id]);
      setConfig((currentConfig: StoryMapConfig) =>
        addCreatedMapLayerToConfig(currentConfig, {
          chapterId,
          mapLayerConfig,
        })
      );
      // The map stage fits the added layer automatically (programmatic move,
      // never recorded as a user camera edit).
      setChangeBoundsLayerId(mapLayerConfig.id);
      setDraftLayerIds(current => addMapLayerId(current, mapLayerConfig.id));
    },
    [setConfig, registerSessionDataLayers, chapterId, setDraftLayerIds]
  );

  // The create flow (session lifecycle, window-wide drop guard) is owned by
  // the session module — the dialog only supplies the host seams and lays
  // the pieces out.
  const createFlow = useMapLayerCreateFlow({
    enabled: open,
    onCreateLayer,
  });
  const { creating, startCreateFlow, cancelCreate, rejectFile } = createFlow;

  const handleConfirm = useCallback(() => {
    const location = _.omitBy(_.isNil, {
      center: mapCenter,
      zoom: mapZoom,
      pitch: mapPitch,
      bearing: mapBearing,
      bounds: mapBounds,
    }) as MapPosition;
    // Saving the map ends any uncommitted creation (only committed layers
    // are in the draft rows).
    cancelCreate();
    onConfirm({
      location,
      mapStyle: mapStyle || config.style,
      mapLayerRows: draftRows,
    });
  }, [
    onConfirm,
    cancelCreate,
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
    // Dialog Cancel discards any in-progress creation (nothing committed).
    cancelCreate();
    onClose();
  }, [onClose, cancelCreate]);

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
      // The map stage fits the added layer automatically (programmatic move,
      // never recorded as a user camera edit).
      setChangeBoundsLayerId(layerId);
      setDraftLayerIds(current => addMapLayerId(current, layerId));
    },
    [draftLayerIds, resolveLayerConfig, setDraftLayerIds]
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

  return (
    <CollaborationContextProvider owner={storyMap} entityType="story_map">
      <MapLayerCreateSessionProvider session={createFlow}>
        <Dialog
          open={open}
          // Escape/backdrop during a creation cancels the CREATION only —
          // the map dialog (and the user's draft) stays.
          onClose={creating ? cancelCreate : handleCancel}
          aria-labelledby="map-location-dialog-title"
          aria-describedby="map-location-dialog-content-text"
          maxWidth="sm"
          fullWidth
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

          <DialogContent>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'stretch', position: 'relative' }}
            >
              {createFlow.dragActive && (
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
                    {/* The overlay never lies: while a creation is in
                      progress drops are ignored — say so. */}
                    {creating
                      ? t('storyMap.form_map_layers_add_drop_busy')
                      : t('storyMap.form_map_layers_add_drop_text')}
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Map
                  use3dTerrain
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
                  <MapLocationChange onPositionChange={handlePositionChange} />
                  <MapLayerPreview
                    mapLayerConfigs={draftMapLayerConfigs}
                    changeBoundsLayerId={changeBoundsLayerId}
                  />
                </Map>
              </Box>
              <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
                {creating ? (
                  /* Inline creation: the steps replace the layers panel in
                   the sidebar (one panel at a time); the map stays visible. */
                  <MapLayerCreateSteps
                    title={title}
                    onCreate={createFlow.handleCreateLayer}
                    onCancel={cancelCreate}
                  />
                ) : (
                  <MapLayersPanel
                    rows={draftRows}
                    activeLayerIds={draftLayerIds}
                    treeLayers={Object.values(layerConfigsById)}
                    fetching={fetching}
                    error={error}
                    dropError={createFlow.dropError}
                    onDismissDropError={createFlow.dismissDropError}
                    onFile={startCreateFlow}
                    onReject={rejectFile}
                    onToggleLayer={onToggleLayer}
                    onReorder={onReorder}
                    onRemove={onRemoveLayer}
                  />
                )}
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      </MapLayerCreateSessionProvider>
    </CollaborationContextProvider>
  );
};
