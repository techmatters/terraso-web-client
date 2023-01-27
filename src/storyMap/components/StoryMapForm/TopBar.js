import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Grid, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';

import { useConfigContext } from './configContext';

import theme from 'theme';

const TopBar = () => {
  const { t } = useTranslation();
  const { config, setPreview, preview } = useConfigContext();

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
      <Grid
        className="form-header"
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
          to="/story-map"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon />
          <Typography sx={{ ml: 1 }}>
            {t('storyMap.form_back_button')}
          </Typography>
        </RouterLink>
      </Grid>
      <Grid item xs={6} sx={baseItemSx}>
        <Typography variant="h3" sx={{ pt: 0 }}>
          {config.title}
        </Typography>
      </Grid>
      <Grid
        item
        xs={4}
        sx={{ ...baseItemSx, justifyContent: 'flex-end', pr: 2 }}
      >
        {preview ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPreview(false)}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPreview(true)}
          >
            Preview
          </Button>
        )}
      </Grid>
    </>
  );
};

export default TopBar;
