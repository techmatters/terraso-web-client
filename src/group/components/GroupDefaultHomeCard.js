import React from 'react';

import { useTranslation } from 'react-i18next';

import { Alert, Box, Divider, Typography } from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const GroupDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      aria-labelledby="groups-default-title"
      sx={{ flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2),
        }}
      >
        <Typography id="groups-default-title" variant="h2">
          {t('group.home_default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
          }}
        >
          <Typography variant="body1">{t('group.default_content')}</Typography>
        </Alert>
      </Box>
      <Divider />
      <CardActionRouterLink
        label={t('group.default_connect_button')}
        to="/groups"
      />
    </HomeCard>
  );
};

export default GroupDefaultHomeCard;
