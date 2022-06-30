import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  ListItem as BaseListItem,
  Button,
  CardActions,
  Divider,
  Link,
  List,
  Stack,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

import GroupMembershipPendingWarning from 'group/membership/components/GroupMembershipPendingWarning';
import HomeCard from 'home/components/HomeCard';

import { withProps } from 'react-hoc';

import theme from 'theme';

const ListItem = withProps(BaseListItem, {
  component: withProps(Stack, { component: 'li' }),
});

const GroupItem = ({ group }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pendingCount = _.getOr(0, 'membersInfo.pendingCount', group);
  return (
    <ListItem direction="column" alignItems="flex-start" spacing={2}>
      <Stack direction="row">
        <Link
          component={RouterLink}
          underline="none"
          to={`/groups/${group.slug}`}
        >
          {group.name}
        </Link>
        <Typography sx={{ ml: 1 }}>
          (
          {t(
            `group.role_${_.getOr(
              'member',
              'membersInfo.accountMembership.userRole',
              group
            ).toLowerCase()}`
          )}
          )
        </Typography>
      </Stack>
      <Restricted permission="group.change" resource={group}>
        {pendingCount > 0 && (
          <GroupMembershipPendingWarning
            link
            count={pendingCount}
            onPendingClick={() => navigate(`/groups/${group.slug}/members`)}
          />
        )}
      </Restricted>
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
