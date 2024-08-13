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
import { Button, Divider, Grid, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';

import ShareDialog from './ShareDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';
import TopBarContainer from './TopBarContainer';

const TopBar = props => {
  const { t } = useTranslation();
  const { storyMap, config, setPreview } = useStoryMapConfigContext();
  const { onPublish, onSaveDraft } = props;
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
          sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2 }}
        >
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
