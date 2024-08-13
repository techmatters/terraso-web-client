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

import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { fetchAuthURLs } from 'terraso-client-shared/account/accountSlice';
import { ReactComponent as GoogleLogo } from 'terraso-client-shared/assets/google.svg';
import { ReactComponent as MicrosoftLogo } from 'terraso-client-shared/assets/microsoft.svg';
import { useFetchData } from 'terraso-client-shared/store/utils';
import AppleIcon from '@mui/icons-material/Apple';
import { Box, Button, Stack, Typography } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

import { withProps } from 'react-hoc';

import ExternalLink from 'common/components/ExternalLink';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePicker from 'localization/components/LocalePicker';
import { useAnalytics } from 'monitoring/analytics';
import { useReferrer } from 'navigation/navigationUtils';

import logo from 'assets/logo.svg';

// ref: https://mui.com/material-ui/icons/#component-prop
const MicrosoftIcon = withProps(SvgIcon, { component: MicrosoftLogo });
const GoogleIcon = withProps(SvgIcon, { component: GoogleLogo });

const AccountForm = () => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { fetching, urls } = useSelector(state => state.account.login);
  const hasToken = useSelector(state => state.account.hasToken);

  useDocumentTitle(t('account.login_document_title'));
  useDocumentDescription(t('account.login_document_description'));

  useFetchData(fetchAuthURLs);

  const { goToReferrer, appendReferrerBase64 } = useReferrer();

  useEffect(() => {
    if (!hasToken) {
      return;
    }
    goToReferrer();
  }, [hasToken, goToReferrer]);

  if (fetching) {
    return <PageLoader />;
  }

  if (hasToken) {
    return null;
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
              startIcon={
                <GoogleIcon sx={{ paddingLeft: '3px', paddingRight: '5px' }} />
              }
              href={appendReferrerBase64(urls.google)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'google' } })
              }
            >
              {t('account.google_login')}
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
              href={appendReferrerBase64(urls.microsoft)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'microsoft' } })
              }
            >
              {t('account.microsoft_login')}
            </Button>
          )}

          {urls.apple && (
            <Button
              variant="outlined"
              startIcon={<AppleIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrerBase64(urls.apple)}
              onClick={() =>
                trackEvent('user.login', { props: { source: 'apple' } })
              }
            >
              {t('account.apple_login')}
            </Button>
          )}
        </Stack>

        <Typography sx={{ m: 2.5 }}>
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
