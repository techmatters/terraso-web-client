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
import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import Restricted from 'permissions/components/Restricted';

const KeyInfoCard = ({ landscape }) => {
  const { t } = useTranslation();
  return (
    <Card
      component="section"
      aria-labelledby="landscape-view-card-title"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography
            variant="h2"
            id="landscape-view-card-title"
            sx={{ pt: 0 }}
          >
            {t('landscape.view_card_title', { name: landscape.name })}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {landscape.description}
        </Typography>
      </CardContent>
      <CardContent component={Stack} sx={{ display: 'flex', flexGrow: 1 }}>
        {landscape.email && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <EmailIcon sx={{ color: 'gray.lite1' }} />
            <Link href={`mailto:${landscape.email}`}>{landscape.email}</Link>
          </Stack>
        )}
        {landscape.website && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon sx={{ color: 'gray.lite1' }} />
            <Link
              href={landscape.website}
              underline="none"
              className="wrap-url"
            >
              {landscape.website}
            </Link>
          </Stack>
        )}
      </CardContent>
      <CardContent>
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/edit`}
          >
            {t('landscape.view_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default KeyInfoCard;
