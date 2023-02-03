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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Avatar,
  Box,
  Divider,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const getAcronym = name => name.match(/\b(\w)/g).join('');

const LandscapeItem = ({ landscape, index }) => {
  const { t } = useTranslation();
  return (
    <ListItem
      sx={{
        display: 'flex',
        padding: theme.spacing(1),
        paddingLeft: 0,
        borderTop: index && `1px solid ${theme.palette.gray.lite1}`, // skip first item
      }}
    >
      <Avatar sx={{ width: 80, height: 80 }} variant="square">
        {getAcronym(landscape.name).toUpperCase()}
      </Avatar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: theme.spacing(2),
        }}
      >
        <Link component={RouterLink} to={`/landscapes/${landscape.slug}`}>
          {landscape.name}
        </Link>
        <Typography>
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

const LandscapesHomeCard = ({ landscapes }) => {
  const { t } = useTranslation();
  return (
    <HomeCard
      aria-labelledby="landscapes-list-title"
      sx={{ flexDirection: 'column' }}
    >
      <Typography
        variant="h2"
        id="landscapes-list-title"
        sx={{ padding: theme.spacing(2) }}
      >
        {t('landscape.home_title')}
      </Typography>
      <List
        aria-describedby="landscapes-list-title"
        sx={{
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
        }}
      >
        {landscapes.map((landscape, index) => (
          <React.Fragment key={landscape.slug}>
            <LandscapeItem landscape={landscape} index={index} />
          </React.Fragment>
        ))}
      </List>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('landscape.home_connect_label')}
        to="/landscapes"
      />
    </HomeCard>
  );
};

export default LandscapesHomeCard;
