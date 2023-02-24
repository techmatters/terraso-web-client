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

import { Button, Grid, Typography } from '@mui/material';

import { useStoryMapConfigContext } from './storyMapConfigContext';

import theme from 'theme';

const TopBarPreview = props => {
  const { t } = useTranslation();
  const { config, setPreview } = useStoryMapConfigContext();
  const { onPublish } = props;

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
    <>
      <Grid item xs={12} sm={8} sx={baseItemSx}>
        <Typography variant="h3" sx={{ pt: 0, pl: 2, fontWeight: 700 }}>
          {t('storyMap.form_preview_title', { title: config.title })}
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        sm={4}
        sx={{ ...baseItemSx, justifyContent: 'flex-end', pr: 2 }}
      >
        <Button variant="text" onClick={() => setPreview(false)}>
          {t('storyMap.form_preview_close')}
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
    </>
  );
};

export default TopBarPreview;
