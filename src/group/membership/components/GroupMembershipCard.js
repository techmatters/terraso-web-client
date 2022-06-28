import React from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

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

import Restricted from 'permissions/components/Restricted';

import AccountAvatar from 'account/components/AccountAvatar';
import { useGroupContext } from 'group/groupContext';

import GroupMembershipJoinLeaveButton from './GroupMembershipJoinLeaveButton';
import {
  MEMBERSHIP_CLOSED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';

import theme from 'theme';

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
  const { membersInfo, fetching, group, onViewMembers } = props;

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
        <Trans i18nKey="group.membership_card_closed_description">
          <Typography variant="body1" sx={{ mb: 2 }}>
            {{ name: owner.name }} description
          </Typography>
          <Typography variant="body1">
            prefix
            <Link
              href={t('group.membership_card_closed_help_url')}
              target="_blank"
            >
              link
            </Link>
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
        total={totalCount}
        sx={{
          flexDirection: 'row',
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2),
        }}
      >
        {membersSample.map((member, index) => (
          <AccountAvatar key={index} user={member} />
        ))}
      </AvatarGroup>
      <Link component="button" onClick={onViewMembers}>
        {t('group.membership_view_all')}
      </Link>
    </CardContent>
  );
};

const GroupMembershipCard = props => {
  const { t } = useTranslation();
  const { groupSlug } = useGroupContext();
  const { onViewMembers, InfoComponent } = props;
  const { fetching, group } = useSelector(
    _.getOr({}, `group.memberships.${groupSlug}`)
  );

  const membersInfo = _.getOr([], 'membersInfo', group);

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
          <Typography variant="h2" id="membership-card-title">
            {t('group.membership_card_title')}
          </Typography>
        }
      />
      <Content
        group={group}
        fetching={fetching}
        membersInfo={membersInfo}
        onViewMembers={onViewMembers}
      />
      {fetching ? null : (
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
    </Card>
  );
};

export default GroupMembershipCard;
