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
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'terrasoApi/store';
import {
  AvatarGroup,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Link,
  Typography,
} from '@mui/material';
import ExternalLink from 'common/components/ExternalLink';
import Restricted from 'permissions/components/Restricted';
import AccountAvatar from 'account/components/AccountAvatar';
import { useGroupContext } from 'group/groupContext';
import {
  MEMBERSHIP_CLOSED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';
import GroupMembershipJoinLeaveButton from './GroupMembershipJoinLeaveButton';
import GroupMembershipPendingWarning from './GroupMembershipPendingWarning';

const Loader = () => {
  const { t } = useTranslation();
  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress aria-label={t('common.loader_label')} />
      </Box>
    </CardContent>
  );
};

const Content = props => {
  const { t } = useTranslation();
  const { owner } = useGroupContext();
  const { user, membersInfo, fetching, group, onViewMembers } = props;

  const membersSample = _.getOr([], 'membersSample', membersInfo);
  const totalCount = _.getOr(0, 'totalCount', membersInfo);

  if (fetching) {
    return <Loader />;
  }

  const userMembership = _.get('membersInfo.accountMembership', group);
  const pendingRequest =
    userMembership &&
    userMembership.membershipStatus === MEMBERSHIP_STATUS_PENDING;
  const closedGroup = group?.membershipType === MEMBERSHIP_CLOSED;

  if (pendingRequest) {
    return (
      <CardContent>
        <Trans i18nKey="group.membership_card_pending_description">
          <Typography variant="body1">
            prefix
            <b>bold</b>
          </Typography>
        </Trans>
      </CardContent>
    );
  }

  if (!userMembership && closedGroup) {
    return (
      <CardContent>
        <Trans
          i18nKey="group.membership_card_closed_description"
          values={{ name: owner.name }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            description
          </Typography>
          <Typography variant="body1">
            prefix
            <ExternalLink href={t('group.membership_card_closed_help_url')}>
              link
            </ExternalLink>
          </Typography>
        </Trans>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {t('group.membership_card_description', {
          count: totalCount,
          name: owner.name,
        })}
      </Typography>
      <AvatarGroup
        component="ul"
        aria-labelledby="membership-card-title"
        total={totalCount}
        sx={{
          flexDirection: 'row',
          marginTop: 2,
          marginBottom: 2,
          paddingLeft: 0,
        }}
      >
        {membersSample.map((member, index) => (
          <AccountAvatar key={index} user={member} component="li" />
        ))}
      </AvatarGroup>
      {user && (
        <Link sx={{ cursor: 'pointer' }} onClick={onViewMembers}>
          {t('group.membership_view_all')}
        </Link>
      )}
    </CardContent>
  );
};

const GroupMembershipCard = props => {
  const { t } = useTranslation();
  const { groupSlug } = useGroupContext();
  const { onViewMembers, InfoComponent } = props;
  const { fetching, group } = useSelector(
    state => state.memberships.memberships[groupSlug] ?? {}
  );
  const { data: user } = useSelector(_.get('account.currentUser'));

  const membersInfo = group?.membersInfo ?? {};

  return (
    <Card
      component="section"
      aria-labelledby="membership-card-title"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="membership-card-title" sx={{ pt: 0 }}>
            {t('group.membership_card_title')}
          </Typography>
        }
      />
      <Content
        user={user}
        group={group}
        fetching={fetching}
        membersInfo={membersInfo}
        onViewMembers={onViewMembers}
      />
      {fetching || !user ? null : (
        <CardActions sx={{ display: 'block', paddingBottom: '24px' }}>
          <Restricted
            permission="group.change"
            resource={group}
            FallbackComponent={() => (
              <>
                <GroupMembershipJoinLeaveButton />
                {InfoComponent && <InfoComponent />}
              </>
            )}
          >
            <Button variant="outlined" onClick={onViewMembers}>
              {t('group.membership_card_manage_members')}
            </Button>
          </Restricted>
        </CardActions>
      )}
      <Restricted permission="group.change" resource={group}>
        {membersInfo.pendingCount > 0 && (
          <CardContent>
            <GroupMembershipPendingWarning
              link
              count={membersInfo.pendingCount}
              onPendingClick={onViewMembers}
            />
          </CardContent>
        )}
      </Restricted>
    </Card>
  );
};

export default GroupMembershipCard;
