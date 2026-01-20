/*
 * Copyright © 2021-2023 Technology Matters
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

import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { Button, Grid, Stack, Typography } from '@mui/material';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import TopBarContainer from 'terraso-web-client/storyMap/components/StoryMapForm/TopBarContainer';

const SAVE_STATUS = {
  saving: {
    message: 'storyMap.form_save_status_saving',
    Icon: SyncIcon,
  },
  saved: {
    message: 'storyMap.form_save_status_saved',
    Icon: CheckIcon,
  },
  error: {
    message: 'storyMap.form_save_status_error',
    Icon: ErrorIcon,
    color: 'error.main',
  },
};

const SaveStatus = props => {
  const { t } = useTranslation();
  const { requestStatus, isDirty } = props;
  const { error } = requestStatus;

  const status = error ? 'error' : isDirty ? 'saving' : 'saved';
  const Icon = SAVE_STATUS[status].Icon;
  const message = SAVE_STATUS[status].message;
  const color = SAVE_STATUS[status].color;

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ color: color || 'gray.dark1' }}
    >
      <Icon sx={{ fontSize: 20 }} />
      <Typography variant="caption">{t(message)}</Typography>
    </Stack>
  );
};

const TopBar = props => {
  const { t } = useTranslation();
  const { storyMap, config } = useStoryMapConfigContext();
  const { onPublish, isDirty, requestStatus } = props;

  const isPublished = storyMap?.isPublished;

  return (
    <TopBarContainer>
      <Grid
        size={2}
        sx={{
          pl: 2,
        }}
      >
        <RouterLink
          to="/tools/story-maps"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon />
          <Typography sx={{ ml: 1 }}>
            {t('storyMap.form_back_button')}
          </Typography>
        </RouterLink>
      </Grid>
      <Grid size={6}>
        <Typography variant="h3" component="h1" sx={{ pt: 0 }}>
          {config.title || t('storyMap.form_no_title_label')}
        </Typography>
      </Grid>
      <Grid
        size={4}
        sx={{
          pr: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <SaveStatus isDirty={isDirty} requestStatus={requestStatus} />
          <Button
            variant="contained"
            color="primary"
            onClick={onPublish}
            sx={{ ml: 2 }}
          >
            {isPublished
              ? t('storyMap.form_republish_button')
              : t('storyMap.form_publish_button')}
          </Button>
        </Stack>
      </Grid>
    </TopBarContainer>
  );
};

export default TopBar;
