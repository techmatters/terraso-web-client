import React from 'react';
import {
  Box,
  CardActions,
  Typography,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import HomeCard from 'home/components/HomeCard';
import { Link } from 'react-router-dom';
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
    <HomeCard sx={{ flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2),
        }}
      >
        <Typography variant="h5">
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
