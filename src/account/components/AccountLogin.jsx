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

import { useCallback, useEffect } from 'react';
import queryString from 'query-string';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { fetchAuthURLs } from 'terraso-client-shared/account/accountSlice';
import googleLogo from 'terraso-client-shared/assets/google.svg';
import microsoftLogo from 'terraso-client-shared/assets/microsoft.svg';
import { useFetchData } from 'terraso-client-shared/store/utils';
import AppleIcon from '@mui/icons-material/Apple';
import { Box, Button, Stack, Typography } from '@mui/material';

import ExternalLink from 'terraso-web-client/common/components/ExternalLink';
import {
  useDocumentDescription,
  useDocumentTitle,
} from 'terraso-web-client/common/document';
import PageHeader from 'terraso-web-client/layout/PageHeader';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import LocalePicker from 'terraso-web-client/localization/components/LocalePicker';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import { useReferrer } from 'terraso-web-client/navigation/navigationUtils';

import logo from 'terraso-web-client/assets/logo.svg';

const AccountForm = () => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { fetching, urls } = useSelector(state => state.account.login);
  const hasToken = useSelector(state => state.account.hasToken);

  useDocumentTitle(t('account.login_document_title'));
  useDocumentDescription(t('account.login_document_description'));

  useFetchData(fetchAuthURLs);

  const { referrer, goToReferrer } = useReferrer();

  const appendNavigationState = useCallback(
    url => {
      const parsedUrl = queryString.parseUrl(url);
      const redirectUrl = queryString.stringifyUrl({
        url: 'account',
        query: {
          referrerBase64: btoa(referrer),
        },
      });

      const state = btoa(
        JSON.stringify({
          redirectUrl,
          origin: window.location.origin,
        })
      );

      return queryString.stringifyUrl({
        ...parsedUrl,
        query: {
          ...parsedUrl.query,
          state,
        },
      });
    },
    [referrer]
  );

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
                <Box
                  component="img"
                  src={googleLogo}
                  alt="Google"
                  sx={{
                    width: 20,
                    height: 20,
                    marginLeft: '3px',
                    marginRight: '5px',
                  }}
                />
              }
              href={appendNavigationState(urls.google)}
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
                <Box
                  component="img"
                  src={microsoftLogo}
                  alt="Microsoft"
                  sx={{
                    width: 20,
                    height: 20,
                    marginLeft: '24px',
                    marginRight: '5px',
                  }}
                />
              }
              href={appendNavigationState(urls.microsoft)}
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
              href={appendNavigationState(urls.apple)}
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
            <ExternalLink href={t('footer.links.tos.url')}>text</ExternalLink>
            <ExternalLink href={t('account.disclaimer_url')}>text</ExternalLink>
          </Trans>
        </Typography>

        <LocalePicker />
      </Stack>
    </Stack>
  );
};

export default AccountForm;
