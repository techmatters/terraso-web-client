/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchAuthURLs } from 'terraso-client-shared/account/accountSlice';
import { useFetchData } from 'terraso-client-shared/store/utils';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import { Box, Button, Stack, Typography } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';
import ExternalLink from 'common/components/ExternalLink';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePicker from 'localization/components/LocalePicker';
import { useAnalytics } from 'monitoring/analytics';
import logo from 'assets/logo.svg';
import { ReactComponent as MicrosoftSvg } from 'assets/microsoft.svg';

// ref: https://mui.com/material-ui/icons/#component-prop
const MicrosoftIcon = props => {
  return <SvgIcon component={MicrosoftSvg} {...props} />;
};

const appendReferrer = (url, referrer) =>
  referrer ? `${url}&state=${referrer}` : url;

const AccountForm = () => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [searchParams] = useSearchParams();
  const { fetching, urls } = useSelector(state => state.account.login);
  const referrer = searchParams.get('referrer');

  useDocumentTitle(t('account.login_document_title'));
  useDocumentDescription(t('account.login_document_description'));

  useFetchData(fetchAuthURLs);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: '80vh' }}
    >
      <Stack sx={{ maxWidth: 'sm' }} alignItems="center">
        <PageHeader header={t('account.welcome_to')}>
          <Box
            component="img"
            src={logo}
            alt={t('common.terraso_projectName')}
            style={{
              display: 'block',
              margin: '24px auto 0',
              width: 125,
              height: 35,
            }}
          />
        </PageHeader>

        <Stack spacing={3} sx={{ margin: '3em 0 8em' }}>
          {urls.google && (
            <Button
              variant="outlined"
              startIcon={<GoogleIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrer(urls.google, referrer)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'google' } })
              }
            >
              {t('account.google_login')}
            </Button>
          )}

          {urls.apple && (
            <Button
              variant="outlined"
              startIcon={<AppleIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrer(urls.apple, referrer)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'apple' } })
              }
            >
              {t('account.apple_login')}
            </Button>
          )}

          {urls.microsoft && (
            <Button
              variant="outlined"
              startIcon={
                <MicrosoftIcon
                  sx={{ paddingLeft: '24px', paddingRight: '5px' }}
                />
              }
              href={appendReferrer(urls.microsoft, referrer)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'microsoft' } })
              }
            >
              {t('account.microsoft_login')}
            </Button>
          )}
        </Stack>

        <Typography sx={{ mb: 4 }}>
          <Trans i18nKey="account.disclaimer">
            prefix
            <ExternalLink href={t('account.disclaimer_url')}>text</ExternalLink>
          </Trans>
        </Typography>

        <LocalePicker />
      </Stack>
    </Stack>
  );
};

export default AccountForm;
