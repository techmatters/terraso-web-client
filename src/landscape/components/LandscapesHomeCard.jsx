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

import { Fragment } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Box, Link, List, ListItem, Typography } from '@mui/material';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import HomeCard from 'terraso-web-client/home/components/HomeCard';

import landscapePlaceholder from 'terraso-web-client/assets/landscape.svg';
import theme from 'terraso-web-client/theme';

const LandscapeItem = ({ landscape }) => {
  const { t } = useTranslation();
  const landscapeUrl = `/landscapes/${landscape.slug}`;

  return (
    <ListItem
      sx={{
        bgcolor: theme.palette.white,
        borderRadius: 1,
        color: 'text.primary',
        display: 'flex',
        alignItems: 'flex-start',
        p: 2,
      }}
      aria-label={landscape.name}
    >
      <Link component={RouterLink} to={landscapeUrl}>
        <img
          alt=""
          width="164"
          height="93"
          src={landscape?.profileImage || landscapePlaceholder}
        />
      </Link>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 2,
        }}
      >
        <Link
          color="secondary.main"
          component={RouterLink}
          to={landscapeUrl}
          sx={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.15px',
            lineHeight: '23px',
          }}
        >
          {landscape.name}
        </Link>
        <Typography
          sx={{
            color: 'secondary.main',
            fontSize: 16,
            fontStyle: 'italic',
            lineHeight: '20px',
            mt: 0.5,
          }}
        >
          {t(
            `landscape.role_${_.getOr(
              'member',
              'accountMembership.userRole',
              landscape
            ).toLowerCase()}`
          )}
        </Typography>
      </Box>
    </ListItem>
  );
};

const LandscapesHomeCard = ({
  landscapes,
  title,
  showAction = true,
  actionLabel,
  actionTo = '/landscapes',
  showHelperText = true,
  contentSx,
  headingSx,
}) => {
  const { t } = useTranslation();
  return (
    <HomeCard
      id="landscapes"
      title={title || t('landscape.home_title')}
      cardSx={{
        bgcolor: theme.palette.secondary.main,
        color: theme.palette.white,
      }}
      contentSx={contentSx}
      headingSx={headingSx}
      titleId="landscapes-list-title"
      action={
        showAction
          ? {
              label: actionLabel || t('landscape.home_connect_label'),
              to: actionTo,
            }
          : null
      }
      helperText={showHelperText ? t('landscape.home_popover') : null}
    >
      <List
        aria-labelledby="landscapes-list-title"
        aria-describedby="landscapes-list-title"
        sx={{
          display: 'grid',
          gap: 2,
          p: 0,
          width: '100%',
        }}
      >
        {landscapes.map(landscape => (
          <Fragment key={landscape.slug}>
            <LandscapeItem landscape={landscape} />
          </Fragment>
        ))}
      </List>
    </HomeCard>
  );
};

export default LandscapesHomeCard;
