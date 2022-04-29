import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import _ from 'lodash/fp';

import {
  Button,
  CardActions,
  Divider,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const GroupItem = ({ group }) => {
  const { t } = useTranslation();
  return (
    <ListItem>
      <Link
        component={RouterLink}
        underline="none"
        to={`/groups/${group.slug}`}
      >
        {group.name}
      </Link>
      <Typography sx={theme => ({ marginLeft: theme.spacing(1) })}>
        (
        {t(
          `group.role_${_.getOr(
            'member',
            'accountMembership.userRole',
            group
          ).toLowerCase()}`
        )}
        )
      </Typography>
    </ListItem>
  );
};

const GroupsHomeCard = ({ groups }) => {
  const { t } = useTranslation();
  return (
    <HomeCard
      aria-labelledby="groups-list-title"
      sx={{ flexDirection: 'column' }}
    >
      <Typography
        variant="h2"
        id="groups-list-title"
        sx={{ padding: theme.spacing(2) }}
      >
        {t('group.home_title')}
      </Typography>
      <List aria-describedby="groups-list-title">
        {groups.map((group, index) => (
          <React.Fragment key={group.slug}>
            <GroupItem group={group} />
            {index !== groups.length - 1 ? (
              <Divider
                component="li"
                sx={{
                  margin: theme.spacing(2),
                }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </List>
      <Divider />
      <CardActions>
        <Button component={RouterLink} to="/groups" sx={{ width: '100%' }}>
          {t('group.home_connect_label').toUpperCase()}
        </Button>
      </CardActions>
    </HomeCard>
  );
};

export default GroupsHomeCard;
