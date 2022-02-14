import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Stack } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';

import { fetchAuthURLs } from 'account/accountSlice';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import PageHeader from 'layout/PageHeader';

import logo from 'assets/logo.svg';

const appendReferrer = (url, referrer) =>
  referrer ? `${url}&state=${referrer}` : url;

const AccountForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { fetching, urls } = useSelector(state => state.account.login);
  const referrer = searchParams.get('referrer');

  useDocumentTitle(t('account.login_document_title'));

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
        <PageHeader header={t('account.welcome_to')} />
        <img
          src={logo}
          width="125"
          height="35"
          alt={t('common.terraso_projectName')}
        />

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
