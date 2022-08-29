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
        <Link
          component={RouterLink}
          underline="none"
          to={`/landscapes/${landscape.slug}`}
        >
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
      <Divider />
      <CardActionRouterLink
        label={t('landscape.home_connect_label')}
        to="/landscapes"
      />
    </HomeCard>
  );
};

export default LandscapesHomeCard;
