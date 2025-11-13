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

import { Trans, useTranslation } from 'react-i18next';
import { Box, Link, Stack, Typography } from '@mui/material';

import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageHeader from 'terraso-web-client/layout/PageHeader';

import notFoundImage from 'terraso-web-client/assets/not-found.png';

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
