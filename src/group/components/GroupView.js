import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Link,
  Stack,
  Button,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import EmailIcon from '@mui/icons-material/Email';

import { fetchGroupView } from 'group/groupSlice';
import GroupMembershipCard from 'group/components/GroupMembershipCard';
import PageLoader from 'common/components/PageLoader';
import Restricted from 'permissions/components/Restricted';
import theme from 'theme';

const GroupCard = ({ group }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t('group.view_card_title', { name: group.name })} />
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
  const { group, fetching } = useSelector(state => state.group.view);
  const { slug } = useParams();

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
    <Box
      sx={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{
          marginBottom: theme.spacing(3),
        }}
      >
        <Typography variant="h1">{group.name}</Typography>
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
          <GroupMembershipCard
            ownerName={group.name}
            groupSlug={group.slug}
            joinLabel="group.view_join_label"
            leaveLabel="group.view_leave_label"
            messageText="group.membership_leave_confirm_message"
            messageTitle="group.membership_leave_confirm_title"
            confirmButtonLabel="group.membership_leave_confirm_button"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GroupView;
