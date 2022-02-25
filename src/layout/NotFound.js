import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { Box, Link, Stack, Typography } from '@mui/material';

import notFoundImage from 'assets/not-found.png';

const HELP_URL = 'https://terraso.org/contact-us/';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader header={t('common.not_found_title')} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 4, sm: 2 }}
        sx={{
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '22px' }}>
            {t('common.not_found_message')}
          </Typography>
          <Typography
            sx={theme => ({
              marginTop: 1,
              fontSize: '16px',
              textTransform: 'uppercase',
            })}
          >
            {t('common.not_found_error_code')}
          </Typography>
          <Typography sx={{ marginTop: 4, fontSize: '16px' }}>
            <Trans i18nKey="common.not_found_help_message">
              Prefix <Link href={HELP_URL}>link</Link>.
            </Trans>
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={notFoundImage}
            alt=""
            sx={{ maxWidth: 313, maxHeight: 313 }}
          />
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default NotFound;
