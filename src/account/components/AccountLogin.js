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

import { Trans } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import { Typography } from '@mui/material';
import { Box, Button, Stack } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

import ExternalLink from 'common/components/ExternalLink';
import { useDocumentTitle } from 'common/document';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePicker from 'localization/components/LocalePicker';
import { useFetchData } from 'state/utils';

import { fetchAuthURLs } from 'account/accountSlice';

import logo from 'assets/logo.svg';

import theme from 'theme';

// ref: https://mui.com/material-ui/icons/#svgicon
const MicrosoftIcon = props => {
  return (
    <SvgIcon {...props}>
      <path d="M2 3h9v9H2V3m9 19H2v-9h9v9M21 3v9h-9V3h9m0 19h-9v-9h9v9Z" />
    </SvgIcon>
  );
};

const appendReferrer = (url, referrer) =>
  referrer ? `${url}&state=${referrer}` : url;

const AccountForm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { fetching, urls } = useSelector(state => state.account.login);
  const referrer = searchParams.get('referrer');

  useDocumentTitle(t('account.login_document_title'));

  useFetchData(fetchAuthURLs);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ height: '80vh', margin: `auto ${theme.spacing(2)}` }}
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

          {urls.microsoft && (
            <Button
              variant="outlined"
              startIcon={<MicrosoftIcon sx={{ paddingRight: '5px' }} />}
              href={appendReferrer(urls.microsoft, referrer)}
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
