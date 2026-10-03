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

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import { ButtonGroup, IconButton, Stack, Typography } from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import FormSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/FormSidebar';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import { updateTransition } from 'terraso-web-client/storyMap/storyMapUtils';

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
  const targetId = activeStepId ?? STORY_MAP_TITLE_ID;

  return (
    <FormSidebar
      open={open}
      onClose={onClose}
      title={t('storyMap.form_configure_chapter_sidebar_title')}
      sectionLabel={t('storyMap.form_configure_chapter_sidebar_section_label')}
      closeLabel={t('storyMap.form_configure_chapter_sidebar_close')}
    >
      <Stack spacing={2} sx={{ my: 1 }}>
        <AlignmentSettings targetId={targetId} />
      </Stack>
    </FormSidebar>
  );
};

export default ConfigureChapterSidebar;
