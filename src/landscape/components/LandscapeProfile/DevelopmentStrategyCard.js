import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

const DevelopmentStrategyCard = ({ landscape }) => {
  const { t } = useTranslation();
  return (
    <Card
      component="section"
      aria-labelledby="landscape-development-card-title"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="landscape-development-card-title">
            {t('landscape.development_card_update_title', {
              name: landscape.name,
            })}
          </Typography>
        }
      />
      <CardContent></CardContent>
      <CardContent>
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/development-strategy/edit`}
          >
            {t('landscape.development_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default DevelopmentStrategyCard;
