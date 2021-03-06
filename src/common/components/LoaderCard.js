import React from 'react';

import { useTranslation } from 'react-i18next';

import { Box, Card, Skeleton } from '@mui/material';

import theme from 'theme';

const LoaderCard = () => {
  const { t } = useTranslation();
  return (
    <Card
      role="progressbar"
      aria-label={t('common.loader_label')}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(2),
      }}
    >
      <Box sx={{ display: 'flex', marginBottom: theme.spacing(2) }}>
        <Skeleton
          sx={{ height: 80, width: 80 }}
          animation="wave"
          variant="rectangular"
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: theme.spacing(2),
          }}
        >
          <Skeleton animation="wave" height={30} width="150px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="150px" />
        </Box>
      </Box>
      <Skeleton sx={{ height: 40 }} animation="wave" variant="rectangular" />
    </Card>
  );
};

export default LoaderCard;
