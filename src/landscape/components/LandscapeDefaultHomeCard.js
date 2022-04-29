import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  CardActions,
  Divider,
  Typography,
} from '@mui/material';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const Actions = () => {
  const { t } = useTranslation();

  return (
    <CardActions>
      <Button component={Link} to="/landscapes" sx={{ width: '100%' }}>
        {t('landscape.default_connect_button').toUpperCase()}
      </Button>
    </CardActions>
  );
};

const LandscapeDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      aria-labelledby="landscapes-default-title"
      sx={{ flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2),
        }}
      >
        <Typography id="landscapes-default-title" variant="h2">
          {t('landscape.home_default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
          }}
        >
          <Typography variant="body1">
            {t('landscape.default_content')}
          </Typography>
        </Alert>
      </Box>
      <Divider />
      <Actions />
    </HomeCard>
  );
};

export default LandscapeDefaultHomeCard;
