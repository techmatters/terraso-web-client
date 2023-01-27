﻿/*
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
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  ListItem as BaseListItem,
  Divider,
  Link,
  List,
  Stack,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';
import Restricted from 'permissions/components/Restricted';

import GroupMembershipPendingWarning from 'group/membership/components/GroupMembershipPendingWarning';
import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from 'group/membership/components/groupMembershipConstants';
import HomeCard from 'home/components/HomeCard';

import { withProps } from 'react-hoc';

import theme from 'theme';

const ListItem = withProps(BaseListItem, {
  component: withProps(Stack, { component: 'li' }),
});

const GroupItem = ({ group, index }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pendingCount = _.getOr(0, 'membersInfo.pendingCount', group);
  const isApproved =
    _.get('membersInfo.accountMembership.membershipStatus', group) ===
    MEMBERSHIP_STATUS_APPROVED;

  const role = isApproved
    ? _.getOr('member', 'membersInfo.accountMembership.userRole', group)
    : MEMBERSHIP_STATUS_PENDING;

  return (
    <ListItem
      direction="column"
      alignItems="flex-start"
      spacing={2}
      sx={{
        paddingLeft: 0,
        borderTop: index && `1px solid ${theme.palette.gray.lite1}`, // skip first item
      }}
    >
      <Stack direction="row">
        <Link component={RouterLink} to={`/groups/${group.slug}`}>
          {group.name}
        </Link>
        <Typography sx={{ ml: 1 }}>
          ({t(`group.role_${role.toLowerCase()}`)})
        </Typography>
      </Stack>
      {!isApproved && (
        <Typography color="text.secondary">
          {t('group.home_pending_message')}
        </Typography>
      )}
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

  const sortedGroups = _.sortBy(
    group =>
      _.get('membersInfo.accountMembership.membershipStatus', group) ===
      MEMBERSHIP_STATUS_APPROVED,
    groups
  );

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
      <List aria-describedby="groups-list-title" sx={{ pl: 2, pr: 2 }}>
        {sortedGroups.map((group, index) => (
          <React.Fragment key={group.slug}>
            <GroupItem group={group} index={index} />
          </React.Fragment>
        ))}
      </List>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('group.home_connect_label')}
        to="/groups"
      />
    </HomeCard>
  );
};

export default GroupsHomeCard;
