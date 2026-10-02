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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useFetchData } from 'terraso-client-shared/store/utils';
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
import CircularProgress from '@mui/material/CircularProgress';

import {
  CollaborationContextProvider,
  useCollaborationContext,
} from 'terraso-web-client/collaboration/collaborationContext';
import DirectoryTree from 'terraso-web-client/common/components/DirectoryTree';
import HelperText from 'terraso-web-client/common/components/HelperText';
import Map, { useMap } from 'terraso-web-client/gis/components/Map';
import { MapboxStyle } from 'terraso-web-client/gis/components/MapboxConstants';
import MapControls from 'terraso-web-client/gis/components/MapControls';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';
import MapStyleSwitcher from 'terraso-web-client/gis/components/MapStyleSwitcher';
import { CompactAddControl } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CompactAddControl';
import { CreateMapLayerFileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CreateMapLayerDialog';
import { isMapLayerFileAccepted } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/mapLayerFileDrop';
import { MapLayerOrderList } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerOrderList';
import {
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import {
  buildMapLayerTree,
  mapLayerTreeToDirectoryNodes,
} from 'terraso-web-client/storyMap/mapLayerTree';
import {
  addMapLayerToTransition,
  removeMapLayerFromTransition,
  reorderTransitionMapLayers,
  resolveMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import { enforceMapLayerOrder } from 'terraso-web-client/storyMap/mapUtils';
import { fetchDataLayers } from 'terraso-web-client/storyMap/storyMapSlice';
import {
  MapBounds,
  MapLayerConfig,
  MapLayerTransition,
  MapPosition,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

const SIDEBAR_WIDTH = 300;

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
};
const MapLocationChange = ({ onPositionChange }: MapLocationChangeProps) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const updatePosition = () => {
      onPositionChange({
        center: map.getCenter(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        bounds: _.flatten(map.getBounds().toArray()) as MapBounds,
      });
    };
    map.on('load', updatePosition);
    map.on('move', updatePosition);

    return () => {
      map.off('load', updatePosition);
      map.off('move', updatePosition);
    };
  }, [map, onPositionChange]);

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
          onLayerAdded={onLayerAdded}
        />
      ))}
    </>
  );
};

type LayerDirectoryTreeProps = {
  mapLayers: MapLayerConfig[];
  activeLayerIds: string[];
  fetching: boolean;
  error: boolean;
  onToggleLayer: (layerId: string) => void;
};
const LayerDirectoryTree = ({
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

/**
 * Compact add control wired to the collaboration context (which lives inside
 * the dialog's provider).
 */
const AddMapLayerControl = ({ onFile }: { onFile: (file: File) => void }) => {
  const { owner } = useCollaborationContext();
  return <CompactAddControl onFile={onFile} disabled={!owner} />;
};

export type MapConfigurationConfirm = {
  location: MapPosition;
  mapStyle: string;
  /** Ordered layer configs, index 0 = topmost on the map. */
  mapLayerConfigs: MapLayerConfig[];
  dataLayerConfigId?: string;
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
  const { setConfig } = useStoryMapConfigActionsContext();
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

  // Draft layer state for this transition. `mapLayers` index 0 is topmost.
  // This is only written back to the config on confirm — except layers
  // created through the create flow, which are committed immediately.
  const [draft, setDraft] = useState<Partial<Transition>>(() => ({
    mapLayers: resolveMapLayers({
      mapLayers: props.mapLayers,
      dataLayerConfigId: props.dataLayerConfigId,
    } as Transition),
    dataLayerConfigId: props.dataLayerConfigId ?? props.mapLayers?.[0]?.layerId,
  }));

  const mapRef = useRef(null);

  const fetchedMapLayers = useSelector(
    (state: any) => state.storyMap.dataLayers.list
  ) as MapLayerConfig[];
  const fetching = useSelector(
    (state: any) => state.storyMap.dataLayers.fetching
  ) as boolean;
  const error = useSelector(
    (state: any) => state.storyMap.dataLayers.error
  ) as boolean;
  const user = useSelector((state: any) => state.account.currentUser);

  useFetchData(
    useCallback(() => {
      if (open && storyMap?.id) {
        return fetchDataLayers({
          ownerId: storyMap.id,
          // Must always pass a string: django-filter skips the filter when the
          // arg is null, which would return ALL groups/landscapes.
          email: user?.data?.email ?? '',
        });
      } else {
        return null;
      }
    }, [open, storyMap?.id, user?.data?.email])
  );

  // Known layer configs: committed config layers plus everything fetched for
  // the layer tree (created layers end up in `config.dataLayers` immediately).
  const layerConfigsById = useMemo(() => {
    const merged: Record<string, MapLayerConfig> = {};
    fetchedMapLayers.forEach(mapLayerConfig => {
      merged[mapLayerConfig.id] = mapLayerConfig;
    });
    Object.values(config.dataLayers ?? {}).forEach(mapLayerConfig => {
      merged[mapLayerConfig.id] = mapLayerConfig;
    });
    return merged;
  }, [fetchedMapLayers, config.dataLayers]);

  const resolveLayerConfig = useCallback(
    (layerId: string) => layerConfigsById[layerId],
    [layerConfigsById]
  );

  const draftMapLayerConfigs = useMemo(
    () =>
      resolveMapLayers(draft as Transition)
        .map(({ layerId }) => resolveLayerConfig(layerId))
        .filter(Boolean) as MapLayerConfig[],
    [draft, resolveLayerConfig]
  );

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
      mapLayerConfigs: draftMapLayerConfigs,
      dataLayerConfigId: draft.dataLayerConfigId,
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
    draftMapLayerConfigs,
    draft.dataLayerConfigId,
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
      const isOn = resolveMapLayers(draft as Transition).some(
        ({ layerId: id }) => id === layerId
      );
      if (isOn) {
        setDraft(current =>
          removeMapLayerFromTransition(current, layerId, resolveLayerConfig)
        );
        return;
      }
      const mapLayerConfig = resolveLayerConfig(layerId);
      if (!mapLayerConfig) {
        return;
      }
      setChangeBoundsLayerId(layerId);
      setDraft(current =>
        addMapLayerToTransition(current, mapLayerConfig, resolveLayerConfig)
      );
    },
    [draft, resolveLayerConfig]
  );

  const onRemoveLayer = useCallback(
    (layerId: string) => {
      setDraft(current =>
        removeMapLayerFromTransition(current, layerId, resolveLayerConfig)
      );
    },
    [resolveLayerConfig]
  );

  const onReorder = useCallback((sourceIndex: number, destIndex: number) => {
    setDraft(current => {
      const mapLayers = [...resolveMapLayers(current as Transition)];
      const [moved] = mapLayers.splice(sourceIndex, 1);
      mapLayers.splice(destIndex, 0, moved);
      return reorderTransitionMapLayers(current, mapLayers);
    });
  }, []);

  /**
   * A layer created through the create flow is committed to the config
   * immediately (into `dataLayers` and prepended onto the target transition's
   * `mapLayers` + compat fields), so it survives a later dialog cancel.
   */
  const onCreateLayer = useCallback(
    (mapLayerConfig: MapLayerConfig) => {
      setConfig((currentConfig: StoryMapConfig) => {
        const getLayerConfig = (layerId: string) =>
          layerId === mapLayerConfig.id
            ? mapLayerConfig
            : currentConfig.dataLayers?.[layerId];
        const applyAdd = (transition?: Transition) =>
          addMapLayerToTransition(
            transition ?? ({} as Transition),
            mapLayerConfig,
            getLayerConfig
          );

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
      setChangeBoundsLayerId(mapLayerConfig.id);
      setDraft(current =>
        addMapLayerToTransition(current, mapLayerConfig, resolveLayerConfig)
      );
    },
    [setConfig, chapterId, resolveLayerConfig]
  );

  // While the dialog is open, the whole window accepts file drops to start
  // the create-new-layer flow preloaded with the dropped file.
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const startCreateFlow = useCallback((file: File) => {
    setPendingFile(file);
  }, []);
  useEffect(() => {
    if (!open) {
      return;
    }
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
      }
    };
    const onDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) {
        return;
      }
      event.preventDefault();
      if (isMapLayerFileAccepted(file)) {
        startCreateFlow(file);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [open, startCreateFlow]);

  return (
    <CollaborationContextProvider owner={storyMap} entityType="story_map">
      <Dialog
        open={open}
        onClose={handleCancel}
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
          <Stack direction="row" spacing={2} sx={{ alignItems: 'stretch' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Map
                ref={mapRef}
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
              <Stack spacing={2}>
                <AddMapLayerControl onFile={startCreateFlow} />
                <MapLayerOrderList
                  mapLayerConfigs={draftMapLayerConfigs}
                  onReorder={onReorder}
                  onRemove={onRemoveLayer}
                />
                <LayerDirectoryTree
                  mapLayers={Object.values(layerConfigsById)}
                  activeLayerIds={resolveMapLayers(draft as Transition).map(
                    ({ layerId }) => layerId
                  )}
                  fetching={fetching}
                  error={error}
                  onToggleLayer={onToggleLayer}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
      <CreateMapLayerFileUpload
        title={title}
        onCreate={onCreateLayer}
        externalFile={pendingFile}
        showDropZone={false}
      />
    </CollaborationContextProvider>
  );
};
