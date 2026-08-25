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
import { Link as RouterLink, useNavigate } from 'react-router';
import {
  ListItem as BaseListItem,
  Link,
  List,
  Stack,
  Typography,
} from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import MembershipPendingWarning from 'terraso-web-client/collaboration/components/MembershipPendingWarning';
import DashboardSummaryCard from 'terraso-web-client/common/components/DashboardSummaryCard';
import Restricted from 'terraso-web-client/permissions/components/Restricted';
import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from 'terraso-web-client/group/membership/components/groupMembershipConstants';

import theme from 'terraso-web-client/theme';

const ListItem = withProps(BaseListItem, {
  component: withProps(Stack, { component: 'li' }),
});

const GroupItem = ({ group }) => {
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
      spacing={0.5}
      sx={{
        bgcolor: theme.palette.white,
        borderRadius: 1,
        color: 'text.primary',
        px: 2,
        py: 2,
      }}
    >
      <Typography
        sx={{
          color: 'secondary.main',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.15px',
          lineHeight: '23px',
        }}
      >
        <Link
          color="inherit"
          component={RouterLink}
          to={`/groups/${group.slug}`}
        >
          {group.name}
        </Link>
      </Typography>
      <Typography
        sx={{
          color: 'secondary.main',
          fontSize: 16,
          fontStyle: 'italic',
          lineHeight: '20px',
        }}
      >
        {t(`group.role_${role.toLowerCase()}`)}
      </Typography>
      {!isApproved && (
        <Typography
          sx={{
            color: 'text.secondary',
          }}
        >
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

const GroupsHomeCard = ({
  groups,
  title,
  showAction = true,
  actionLabel,
  actionTo = '/groups',
}) => {
  const { t } = useTranslation();

  const sortedGroups = _.sortBy(
    group =>
      _.get('membershipInfo.accountMembership.membershipStatus', group) ===
      MEMBERSHIP_STATUS_APPROVED,
    groups
  );

  return (
    <DashboardSummaryCard
      title={title || t('group.home_default_title')}
      action={
        showAction
          ? {
              label: actionLabel || t('group.home_connect_label'),
              to: actionTo,
            }
          : null
      }
      titleId="groups-list-title"
    >
      <List
        aria-labelledby="groups-list-title"
        aria-describedby="groups-list-title"
        sx={{
          display: 'grid',
          gap: 2,
          p: 0,
          width: '100%',
        }}
      >
        {sortedGroups.map(group => (
          <Fragment key={group.slug}>
            <GroupItem group={group} />
          </Fragment>
        ))}
      </List>
    </DashboardSummaryCard>
  );
};

export default GroupsHomeCard;
