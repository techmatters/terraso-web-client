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
import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Grid, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';

import { useConfigContext } from './configContext';

import theme from 'theme';

const TopBar = props => {
  const { t } = useTranslation();
  const { config, setPreview } = useConfigContext();
  const { onPublish, onSaveDraft } = props;

  const baseItemSx = useMemo(
    () => ({
      borderBottom: `1px solid ${theme.palette.gray.lite1}`,
      display: 'flex',
      alignItems: 'center',
      pt: 3,
      pb: 1,
      zIndex: 2,
      bgcolor: 'white',
      minHeight: 70,
    }),
    []
  );

  return (
    <Grid
      id="form-header"
      container
      component="section"
      aria-label={t('storyMap.form_header_section_label')}
    >
      <Grid
        item
        xs={2}
        sx={{
          ...baseItemSx,
          width: '100%',
          zIndex: 2,
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
      <Grid item xs={6} sx={baseItemSx}>
        <Typography variant="h3" component="h1" sx={{ pt: 0 }}>
          {config.title || t('storyMap.form_no_title_label')}
        </Typography>
      </Grid>
      <Grid
        item
        xs={4}
        sx={{ ...baseItemSx, justifyContent: 'flex-end', pr: 2 }}
      >
        <Button variant="text" color="primary" onClick={() => setPreview(true)}>
          {t('storyMap.form_preview_button')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={onSaveDraft}
          sx={{ ml: 2 }}
        >
          {t('storyMap.form_save_draft_button')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onPublish}
          sx={{ ml: 2 }}
        >
          {t('storyMap.form_publish_button')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default TopBar;
