import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';

import { fetchAuthURLs } from 'account/accountSlice';
import PageLoader from 'common/components/PageLoader';

import logo from 'assets/logo.svg';

const appendReferrer = (url, referrer) =>
  referrer ? `${url}&state=${referrer}` : url;

const AccountForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { fetching, urls } = useSelector(state => state.account.login);
  const referrer = searchParams.get('referrer');

  useEffect(() => {
    dispatch(fetchAuthURLs());
  }, [dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ height: '80vh' }}
    >
      <Stack sx={{ maxWidth: 'sm' }} alignItems="center">
        <Typography variant="h1">{t('account.welcome_to')}</Typography>
        <img src={logo} height="35px" alt={t('common.terraso_projectName')} />

        <Stack spacing={3} sx={{ margin: '3em 0 8em' }}>
          {urls.google && (
            <Button
              variant="outlined"
              startIcon={<GoogleIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrer(urls.google, referrer)}
            >
              {t('account.google_login')}
            </Button>
          )}

          {urls.apple && (
            <Button
              variant="outlined"
              startIcon={<AppleIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrer(urls.apple, referrer)}
            >
              {t('account.apple_login')}
            </Button>
          )}
        </Stack>

        <p dangerouslySetInnerHTML={{ __html: t('account.disclaimer') }} />
      </Stack>
    </Stack>
  );
};

export default AccountForm;
