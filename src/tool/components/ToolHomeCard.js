import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Stack, Typography } from '@mui/material';

import HomeCard from 'home/components/HomeCard';
import theme from 'theme';

const ToolHomeCard = () => {
  const { t } = useTranslation();
  return (
    <HomeCard
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2),
      }}
    >
      <Typography variant="h5">{t('tool.home_card_title')}</Typography>
      <Typography
        variant="body1"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2),
        }}
      ></Typography>
      <Stack direction="row" spacing={3}>
        <Link component={RouterLink} to="/tools">
          <img
            src="/tools/kobo-small.png"
            alt={t('tool.home_card_img_alt')}
            height={64}
          />
        </Link>
        <Stack spacing={1}>
          <Link component={RouterLink} to="/tools">
            <Typography>{t('tool.home_card_kobo_title')}</Typography>
          </Link>
          {t('tool.home_card_description')}
        </Stack>
      </Stack>
    </HomeCard>
  );
};

export default ToolHomeCard;
