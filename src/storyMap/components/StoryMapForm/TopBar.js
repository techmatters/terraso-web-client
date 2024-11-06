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

import React from 'react';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { Button, Divider, Grid, Stack, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';

import ShareDialog from './ShareDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';
import TopBarContainer from './TopBarContainer';

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
  const { storyMap, config, setPreview } = useStoryMapConfigContext();
  const { onPublish, onSaveDraft, isDirty, requestStatus } = props;
  const [openShareDialog, setOpenShareDialog] = React.useState(false);

  const isPublished = storyMap?.isPublished;

  return (
    <>
      {storyMap && (
        <ShareDialog
          open={openShareDialog}
          onClose={() => setOpenShareDialog(false)}
        />
      )}
      <TopBarContainer>
        <Grid
          item
          xs={2}
          sx={{
            width: '100%',
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
        <Grid item xs={6}>
          <Typography variant="h3" component="h1" sx={{ pt: 0 }}>
            {config.title || t('storyMap.form_no_title_label')}
          </Typography>
        </Grid>
        <Grid
          item
          xs={4}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            pr: 2,
            alignItems: 'center',
          }}
        >
          <SaveStatus isDirty={isDirty} requestStatus={requestStatus} />
          {storyMap && (
            <>
              <Button
                variant="text"
                color="primary"
                onClick={() => setOpenShareDialog(true)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('storyMap.form_share_button')}
              </Button>
              <Divider flexItem orientation="vertical" />
            </>
          )}
          <Button
            variant="text"
            color="primary"
            onClick={() => setPreview(true)}
            sx={{
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {t('storyMap.form_preview_button')}
          </Button>
          {!isPublished && (
            <Button
              disabled={!isDirty}
              variant="outlined"
              color="primary"
              onClick={onSaveDraft}
              sx={{ ml: 2 }}
            >
              {t('storyMap.form_save_draft_button')}
            </Button>
          )}
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
        </Grid>
      </TopBarContainer>
    </>
  );
};

export default TopBar;
