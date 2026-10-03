/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import { Box, ButtonGroup, IconButton, Stack, Typography } from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import { CollaborationContextProvider } from 'terraso-web-client/collaboration/collaborationContext';
import HelperText from 'terraso-web-client/common/components/HelperText';
import FormSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/FormSidebar';
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
import {
  addMapLayerId,
  moveMapLayerId,
  removeMapLayerId,
  resolveMapLayers,
  toMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import {
  getTransition,
  updateTransition,
} from 'terraso-web-client/storyMap/storyMapUtils';

const ConfigButton = withProps(IconButton, {
  size: 'small',
  sx: {
    bgcolor: 'gray.lite1',
    borderRadius: 0,
    '&:hover': { bgcolor: 'gray.mid', borderRadius: 0 },
  },
});

/**
 * The chapter alignment buttons (moved from the chapter editor's vertical
 * button group). Alignment is a per-CHAPTER field: the title transition has
 * no alignment in the config schema, so the control is hidden while the
 * title step is the edit target.
 */
const AlignmentSettings = ({ targetId }) => {
  const { t } = useTranslation();
  const { setConfig } = useStoryMapConfigActionsContext();

  const options = useMemo(
    () => [
      {
        label: t('storyMap.form_chapter_alignment_left'),
        Icon: AlignHorizontalLeftIcon,
        value: 'left',
      },
      {
        label: t('storyMap.form_chapter_alignment_center'),
        Icon: AlignHorizontalCenterIcon,
        value: 'center',
      },
      {
        label: t('storyMap.form_chapter_alignment_right'),
        Icon: AlignHorizontalRightIcon,
        value: 'right',
      },
    ],
    [t]
  );

  const onAlignmentChange = useCallback(
    alignment => {
      setConfig(config =>
        updateTransition({
          config,
          id: targetId,
          update: transition => ({ ...transition, alignment }),
        })
      );
    },
    [setConfig, targetId]
  );

  if (targetId === STORY_MAP_TITLE_ID) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="h3">
        {t('storyMap.form_chapter_alignment_buttons')}
      </Typography>
      <ButtonGroup
        role="group"
        orientation="vertical"
        aria-label={t('storyMap.form_chapter_alignment_buttons')}
      >
        {options.map(option => (
          <ConfigButton
            key={option.value}
            title={option.label}
            onClick={() => onAlignmentChange(option.value)}
          >
            <option.Icon />
          </ConfigButton>
        ))}
      </ButtonGroup>
    </Stack>
  );
};

/**
 * The persistent "Configure Chapter" sidebar: the map configuration
 * functionality that lived in the map configuration dialog (layer panel,
 * map position/style controls on the editor map) plus the chapter alignment
 * settings. Every edit applies IMMEDIATELY to the active step's config
 * (there is no Save/Cancel — the editor's draft autosave persists it).
 */
export const ConfigureChapterSidebar = ({
  open,
  onClose,
  activeStepId,
  onFitLayerBounds,
}) => {
  const { t } = useTranslation();
  const { config, storyMap } = useStoryMapConfigDataContext();
  const { setConfig, registerSessionDataLayers } =
    useStoryMapConfigActionsContext();
  const user = useSelector(state => state.account.currentUser);
  const targetId = activeStepId ?? STORY_MAP_TITLE_ID;

  const targetTransition = getTransition({ config, id: targetId });

  // Layer draft + layer index fetch (the hook is host-agnostic; this host is
  // persistent, so the fetch is enabled while the sidebar is open). The
  // draft is written back to the config on EVERY mutation — immediate-apply
  // semantics, there is no confirm step.
  const {
    draftLayerIds,
    setDraftLayerIds,
    draftRows,
    layerConfigsById,
    resolveLayerConfig,
    fetching,
    error,
  } = useLayerDraft({
    storyMapId: storyMap?.id,
    email: user?.data?.email,
    fetchEnabled: open,
    mapLayers: targetTransition?.mapLayers,
    dataLayerConfigId: targetTransition?.dataLayerConfigId,
    dataLayers: config.dataLayers,
  });

  // Retarget the draft when the active step changes (the hook owns one
  // transition's draft; a target swap resets it from the new transition).
  const previousTargetRef = useRef(targetId);
  useEffect(() => {
    if (previousTargetRef.current === targetId) {
      return;
    }
    previousTargetRef.current = targetId;
    const transition = getTransition({ config, id: targetId });
    setDraftLayerIds(
      resolveMapLayers(transition).map(({ layerId }) => layerId)
    );
  }, [targetId, config, setDraftLayerIds]);

  /**
   * IMMEDIATE-APPLY WRITE: the ordered layer ids replace the active
   * transition's `mapLayers` and the resolved configs merge into the
   * `dataLayers` payload. The compat fields (dataLayerConfigId,
   * onChapterEnter/onChapterExit) are derived at the config write boundary
   * (see syncTransitionLayerFields) — never here.
   */
  const writeLayerIds = useCallback(
    nextLayerIds => {
      setDraftLayerIds(nextLayerIds);
      setConfig(currentConfig => {
        const dataLayerConfigs = _.keyBy(
          'id',
          nextLayerIds.map(resolveLayerConfig).filter(Boolean)
        );
        return {
          ...updateTransition({
            config: currentConfig,
            id: targetId,
            update: transition => ({
              ...transition,
              mapLayers: toMapLayers(nextLayerIds),
            }),
          }),
          dataLayers: {
            ...currentConfig.dataLayers,
            ...dataLayerConfigs,
          },
        };
      });
    },
    [setConfig, setDraftLayerIds, resolveLayerConfig, targetId]
  );

  const onToggleLayer = useCallback(
    layerId => {
      const isOn = draftLayerIds.includes(layerId);
      if (isOn) {
        writeLayerIds(removeMapLayerId(draftLayerIds, layerId));
        return;
      }
      if (!resolveLayerConfig(layerId)) {
        return;
      }
      writeLayerIds(addMapLayerId(draftLayerIds, layerId));
      // The map fits the added layer — a programmatic move that must not be
      // recorded as a user camera edit.
      onFitLayerBounds?.(layerId);
    },
    [draftLayerIds, resolveLayerConfig, writeLayerIds, onFitLayerBounds]
  );

  const onRemoveLayer = useCallback(
    layerId => {
      writeLayerIds(removeMapLayerId(draftLayerIds, layerId));
    },
    [draftLayerIds, writeLayerIds]
  );

  const onReorder = useCallback(
    (sourceIndex, destIndex) => {
      writeLayerIds(moveMapLayerId(draftLayerIds, sourceIndex, destIndex));
    },
    [draftLayerIds, writeLayerIds]
  );

  /**
   * COMMIT CONTRACT (product spec): a layer created through the create flow
   * is added to the active step IMMEDIATELY (immediate-apply — there is no
   * dialog to survive). Its payload goes into `dataLayers`; only `mapLayers`
   * + `dataLayers` are written (the compat fields derive at the write
   * boundary). Removing the layer from the step only DETACHES it: the
   * created asset is registered as session-created (exempt from save-time
   * pruning) and stays available in the tree — it is never destroyed.
   */
  const onCreateLayer = useCallback(
    mapLayerConfig => {
      registerSessionDataLayers([mapLayerConfig.id]);
      setDraftLayerIds(current => addMapLayerId(current, mapLayerConfig.id));
      setConfig(currentConfig =>
        updateTransition({
          config: {
            ...currentConfig,
            dataLayers: {
              ...currentConfig.dataLayers,
              [mapLayerConfig.id]: mapLayerConfig,
            },
          },
          id: targetId,
          update: transition => ({
            ...transition,
            mapLayers: toMapLayers(
              addMapLayerId(
                resolveMapLayers(transition).map(({ layerId }) => layerId),
                mapLayerConfig.id
              )
            ),
          }),
        })
      );
      onFitLayerBounds?.(mapLayerConfig.id);
    },
    [
      setConfig,
      setDraftLayerIds,
      registerSessionDataLayers,
      targetId,
      onFitLayerBounds,
    ]
  );

  // While the sidebar is open, the whole window accepts file drops to start
  // the create-new-layer flow preloaded with the dropped file.
  const [pendingFile, setPendingFile] = useState();
  const [dropError, setDropError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  // True while CreateMapLayerDialog is open: window drops must never swap the
  // file mid-form.
  const [createFlowActive, setCreateFlowActive] = useState(false);
  const startCreateFlow = useCallback(
    file => {
      if (createFlowActive) {
        return;
      }
      setDropError(null);
      setPendingFile(file);
    },
    [createFlowActive]
  );
  const onRejectFile = useCallback(
    file => {
      setDropError(mapLayerFileRejectionMessage(file, t));
    },
    [t]
  );
  useEffect(() => {
    if (!open) {
      return;
    }
    const onDragOver = event => {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        setDragActive(true);
      }
    };
    const onDragLeave = event => {
      // Inner dragleave events fire for every element crossed; only leaving
      // the window (no relatedTarget) cancels the affordance.
      if (!event.relatedTarget) {
        setDragActive(false);
      }
    };
    const onDrop = event => {
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

  const targetTitle =
    targetId === STORY_MAP_TITLE_ID
      ? t('storyMap.form_title_location_dialog_title')
      : targetTransition?.title;

  return (
    <CollaborationContextProvider owner={storyMap} entityType="story_map">
      <FormSidebar
        open={open}
        onClose={onClose}
        title={t('storyMap.form_configure_chapter_sidebar_title')}
        sectionLabel={t(
          'storyMap.form_configure_chapter_sidebar_section_label'
        )}
        closeLabel={t('storyMap.form_configure_chapter_sidebar_close')}
      >
        <Stack spacing={2} sx={{ my: 1, position: 'relative' }}>
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
          <AlignmentSettings targetId={targetId} />
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
            sx={{ width: '100%' }}
          />
          <HelperText
            showLabel
            label={t('storyMap.form_location_dialog_helper_text_label')}
            Component={SetMapHelperText}
            buttonProps={{
              sx: { pl: 0, color: 'gray.dark1' },
            }}
          />
        </Stack>
      </FormSidebar>
      <CreateMapLayerFileUpload
        title={targetTitle}
        onCreate={onCreateLayer}
        externalFile={pendingFile}
        showDropZone={false}
        onCreateDialogOpenChange={setCreateFlowActive}
      />
    </CollaborationContextProvider>
  );
};

export default ConfigureChapterSidebar;
