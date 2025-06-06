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
import { Trans, useTranslation } from 'react-i18next';
import { Button, Grid, Typography } from '@mui/material';

import { useStoryMapConfigContext } from './storyMapConfigContext';
import TopBarContainer from './TopBarContainer';

const TopBarPreview = props => {
  const { t } = useTranslation();
  const { storyMap, config, setPreview } = useStoryMapConfigContext();
  const { onPublish } = props;

  const isPublished = storyMap?.isPublished;

  return (
    <TopBarContainer>
      <Grid size={{ xs: 12, sm: 8 }}>
        <Typography variant="h3" sx={{ pt: 0, pl: 2, fontWeight: 700 }}>
          {t ? (
            <Trans
              i18nKey="storyMap.form_preview_title"
              values={{ title: config.title }}
            >
              prefix
              <i>italic</i>
            </Trans>
          ) : (
            t('storyMap.form_preview_title_blank')
          )}
        </Typography>
      </Grid>
      <Grid
        size={{ xs: 12, sm: 4 }}
        sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2 }}
      >
        <Button
          variant="text"
          onClick={() => setPreview(false)}
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
          }}
        >
          {t('storyMap.form_preview_close')}
        </Button>
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
  );
};

export default TopBarPreview;
