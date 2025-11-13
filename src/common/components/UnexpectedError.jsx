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

import { useTranslation } from 'react-i18next';
import { Alert, Paper, Stack } from '@mui/material';

import logo from 'terraso-web-client/assets/logo.svg';

const UnexpectedError = () => {
  const { t } = useTranslation();

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: '80vh' }}
    >
      <Stack
        component={Paper}
        elevation={0}
        sx={{ maxWidth: 'md', padding: 3 }}
        alignItems="center"
      >
        <img
          src={logo}
          width="125"
          height="35"
          alt={t('common.terraso_projectName')}
        />

        <Alert severity="error" sx={{ margin: '3em 0 8em' }}>
          {t('common.unexpected_error')}
        </Alert>
      </Stack>
    </Stack>
  );
};

export default UnexpectedError;
