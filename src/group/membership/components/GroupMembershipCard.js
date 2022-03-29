import React from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  AvatarGroup,
  CircularProgress,
  Box,
  Link,
} from '@mui/material';

import { useGroupContext } from 'group/groupContext';
import GroupMembershipJoinLeaveButton from './GroupMembershipJoinLeaveButton';
import AccountAvatar from 'account/components/AccountAvatar';
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
  const { membersInfo, fetching, onViewMembers } = props;

  const membersSample = _.getOr([], 'membersSample', membersInfo);
  const totalCount = _.getOr(0, 'totalCount', membersInfo);

  if (fetching) {
    return <Loader />;
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
  const { onViewMembers } = props;
  const { fetching, group } = useSelector(
    _.getOr({}, `group.memberships.${groupSlug}`)
  );

  const membersInfo = _.getOr([], 'membersInfo', group);

  return (
    <Card component="section" aria-labelledby="membership-card-title">
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="membership-card-title">
            {t('group.membership_card_title')}
          </Typography>
        }
      />
      <Content
        fetching={fetching}
        membersInfo={membersInfo}
        onViewMembers={onViewMembers}
      />
      {fetching ? null : (
        <CardActions>
          <GroupMembershipJoinLeaveButton />
        </CardActions>
      )}
    </Card>
  );
};

export default GroupMembershipCard;
