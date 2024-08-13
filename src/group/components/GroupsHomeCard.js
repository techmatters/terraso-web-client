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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  ListItem as BaseListItem,
  Link,
  List,
  Stack,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

import MembershipPendingWarning from 'collaboration/components/MembershipPendingWarning';
import Restricted from 'permissions/components/Restricted';
import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from 'group/membership/components/groupMembershipConstants';
import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const ListItem = withProps(BaseListItem, {
  component: withProps(Stack, { component: 'li' }),
});

const GroupItem = ({ group, index }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pendingCount = _.getOr(0, 'membershipInfo.pendingCount', group);
  const isApproved =
    _.get('membershipInfo.accountMembership.membershipStatus', group) ===
    MEMBERSHIP_STATUS_APPROVED;

  const role = isApproved
    ? _.getOr('member', 'membershipInfo.accountMembership.userRole', group)
    : MEMBERSHIP_STATUS_PENDING;

  return (
    <ListItem
      direction="column"
      alignItems="flex-start"
      aria-label={group.slug}
      spacing={2}
      sx={{
        paddingLeft: 0,
        borderTop: index && `1px solid ${theme.palette.gray.lite1}`, // skip first item
      }}
    >
      <Typography component="span">
        <Link component={RouterLink} to={`/groups/${group.slug}`}>
          {group.name}
        </Link>{' '}
        ({t(`group.role_${role.toLowerCase()}`)})
      </Typography>
      {!isApproved && (
        <Typography color="text.secondary">
          {t('group.home_pending_message')}
        </Typography>
      )}
      <Restricted permission="group.change" resource={group}>
        {pendingCount > 0 && (
          <MembershipPendingWarning
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
      _.get('membershipInfo.accountMembership.membershipStatus', group) ===
      MEMBERSHIP_STATUS_APPROVED,
    groups
  );

  return (
    <HomeCard
      title={t('group.home_default_title')}
      action={{
        label: t('group.home_connect_label'),
        to: '/groups',
      }}
      contentBackgroundColor="white"
      titleId="groups-list-title"
    >
      <List
        aria-labelledby="groups-list-title"
        aria-describedby="groups-list-title"
        sx={{ width: '100%' }}
      >
        {sortedGroups.map((group, index) => (
          <React.Fragment key={group.slug}>
            <GroupItem group={group} index={index} />
          </React.Fragment>
        ))}
      </List>
    </HomeCard>
  );
};

export default GroupsHomeCard;
