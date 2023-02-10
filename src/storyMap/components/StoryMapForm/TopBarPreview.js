import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Grid, Typography } from '@mui/material';

import { useConfigContext } from './configContext';

import theme from 'theme';

const TopBarPreview = props => {
  const { t } = useTranslation();
  const { config, setPreview } = useConfigContext();
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
