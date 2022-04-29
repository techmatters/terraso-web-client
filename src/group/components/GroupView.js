import React, { useEffect } from 'react';
import { withProps } from 'react-hoc';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import _ from 'lodash/fp';

import EmailIcon from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import Restricted from 'permissions/components/Restricted';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupView } from 'group/groupSlice';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';

import theme from 'theme';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  renderLabel: () => 'group.view_leave_label',
  buttonProps: {
    sx: { flexGrow: 1 },
  },
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'group.view_join_label',
});

const GroupCard = ({ group }) => {
  const { t } = useTranslation();
  return (
    <Card component="section" aria-labelledby="group-view-card-title">
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="group-view-card-title">
            {t('group.view_card_title', { name: group.name })}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {group.description}
        </Typography>
      </CardContent>
      <CardContent>
        {group.email && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginBottom: theme.spacing(2) }}
          >
            <EmailIcon sx={{ color: 'gray.lite1' }} />
            <Link href={`mailto:${group.email}`} underline="none">
              {group.email}
            </Link>
          </Stack>
        )}
        {group.website && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon sx={{ color: 'gray.lite1' }} />
            <Link href={group.website} underline="none">
              {group.website}
            </Link>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const GroupView = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { group, fetching } = useSelector(state => state.group.view);
  const { slug } = useParams();

  useDocumentTitle(
    t('group.view_document_title', { name: _.get('name', group) }),
    fetching
  );

  useEffect(() => {
    dispatch(fetchGroupView(slug));
  }, [dispatch, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  if (!group) {
    return null;
  }

  return (
    <PageContainer>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{
          marginBottom: theme.spacing(3),
        }}
      >
        <PageHeader header={group.name} />
        <Restricted permission="group.change" resource={group}>
          <Button
            variant="contained"
            component={RouterLink}
            to={`/groups/${group.slug}/edit`}
          >
            {t('group.view_update_button')}
          </Button>
        </Restricted>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <GroupCard group={group} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupContextProvider
            owner={group}
            groupSlug={group.slug}
            MemberJoinButton={MemberJoinButton}
            MemberLeaveButton={MemberLeaveButton}
          >
            <GroupMembershipCard
              onViewMembers={() => navigate(`/groups/${group.slug}/members`)}
            />
          </GroupContextProvider>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default GroupView;
