/*
 * Copyright © 2023 Technology Matters
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
import React, { useEffect, useRef, useState } from 'react';
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

import {
  MEMBERSHIP_STATUS_PENDING,
  MEMBERSHIP_TYPE_CLOSED,
} from 'collaboration/collaborationConstants';
import { useCollaborationContext } from 'collaboration/collaborationContext';
import ExternalLink from 'common/components/ExternalLink';
import AccountAvatar from 'account/components/AccountAvatar';

import MembershipJoinLeaveButton from './MembershipJoinLeaveButton';
import MembershipPendingWarning from './MembershipPendingWarning';

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
  const { owner, membershipsInfo, accountMembership } =
    useCollaborationContext();
  const { user, fetching, onViewMembers } = props;
  const avatarGroupRef = useRef();
  const [avatarCount, setAvatarCount] = useState();

  const membersSample = _.getOr([], 'membershipsSample', membershipsInfo);
  const totalCount = _.getOr(0, 'totalCount', membershipsInfo);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(event => {
      setAvatarCount(
        event[0].contentBoxSize[0].inlineSize /
          event[0].contentBoxSize[0].blockSize
      );
    });

    if (avatarGroupRef) {
      resizeObserver.observe(avatarGroupRef.current);
    }
  }, [avatarGroupRef]);

  if (fetching) {
    return <Loader />;
  }

  const pendingRequest =
    accountMembership?.membershipStatus === MEMBERSHIP_STATUS_PENDING;
  const closedGroup =
    membershipsInfo?.membershipType === MEMBERSHIP_TYPE_CLOSED;

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

  if ((!accountMembership || accountMembership.fetching) && closedGroup) {
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

  console.log(membersSample);

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
        max={avatarCount}
        sx={{
          flexDirection: 'row',
          marginTop: 2,
          marginBottom: 2,
          paddingLeft: 0,
        }}
        children={membersSample.map((membership, index) => (
          <AccountAvatar key={index} user={membership.user} component="li" />
        ))}
        ref={avatarGroupRef}
      ></AvatarGroup>
      {user && (
        <Link sx={{ cursor: 'pointer' }} onClick={onViewMembers}>
          {t('group.membership_view_all')}
        </Link>
      )}
    </CardContent>
  );
};

const MembershipCard = props => {
  const { t } = useTranslation();
  const { membershipsInfo } = useCollaborationContext();
  const { onViewMembers, InfoComponent, fetching, allowedToManageMembers } =
    props;
  const { data: user } = useSelector(_.get('account.currentUser'));

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
      <Content user={user} fetching={fetching} onViewMembers={onViewMembers} />
      {fetching || !user ? null : (
        <CardActions sx={{ display: 'block', paddingBottom: '24px' }}>
          {allowedToManageMembers ? (
            <Button variant="outlined" onClick={onViewMembers}>
              {t('group.membership_card_manage_members')}
            </Button>
          ) : (
            <>
              <MembershipJoinLeaveButton />
              {InfoComponent && <InfoComponent />}
            </>
          )}
        </CardActions>
      )}
      {allowedToManageMembers && membershipsInfo.pendingCount > 0 && (
        <CardContent>
          <MembershipPendingWarning
            link
            count={membershipsInfo.pendingCount}
            onPendingClick={onViewMembers}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default MembershipCard;
