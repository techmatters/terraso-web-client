import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Link,
  Stack,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

import { fetchLandscapeView } from 'landscape/landscapeSlice';
import { withProps } from 'react-hoc';
import { useDocumentTitle } from 'common/document';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';
import PageLoader from 'layout/PageLoader';
import { GroupContextProvider } from 'group/groupContext';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import PageHeader from 'layout/PageHeader';
import PageContainer from 'layout/PageContainer';
import LandscapeMap from 'landscape/components/LandscapeMap';
import Restricted from 'permissions/components/Restricted';
import InlineHelp from 'common/components/InlineHelp';
import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.view_leave_label',
  buttonProps: {
    sx: { flexGrow: 1 },
  },
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'landscape.view_join_label',
});

const LandscapeCard = ({ landscape }) => {
  const { t } = useTranslation();
  return (
    <Card component="section" aria-labelledby="landscape-view-card-title">
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="landscape-view-card-title">
            {t('landscape.view_card_title', { name: landscape.name })}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {landscape.description}
        </Typography>
      </CardContent>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PublicIcon sx={{ color: 'gray.lite1' }} />
          <Link href={landscape.website} underline="none">
            {landscape.website}
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
};

const LandscapeView = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { landscape, fetching } = useSelector(state => state.landscape.view);
  const { data: user } = useSelector(state => state.account.currentUser);
  const { slug } = useParams();

  useDocumentTitle(
    t('landscape.view_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useEffect(() => {
    dispatch(fetchLandscapeView(slug));
  }, [dispatch, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  if (!landscape) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader header={landscape.name} />
      <Restricted permission="landscape.change" resource={landscape}>
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          <Trans i18nKey="landscape.view_manager_help">
            {{ name: t('user.full_name', { user }), landscape: landscape.name }}
            <Link href="TODO">link</Link>.
          </Trans>
        </Alert>
      </Restricted>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ padding: 2 }}>
            <Typography
              variant="caption"
              display="block"
              sx={{
                marginBottom: theme.spacing(2),
              }}
            >
              {landscape.location}
            </Typography>
            <LandscapeMap
              landscape={landscape}
              label={t('landscape.view_map_title')}
            />
            <InlineHelp
              items={[
                {
                  title: t('landscape.view_map_boundaries_help'),
                  details: (
                    <Trans i18nKey="landscape.view_map_boundaries_help_details">
                      Prefix
                      <Link href="https://terraso.org/contact-us/?noredirect=en-US">
                        link
                      </Link>
                      .
                    </Trans>
                  ),
                },
              ]}
            />
            <Restricted permission="landscape.change" resource={landscape}>
              <Button
                variant="outlined"
                component={RouterLink}
                to={`/landscapes/${landscape.slug}/boundaries`}
                sx={{ marginTop: 2 }}
              >
                {t('landscape.view_map_boundaries_update')}
              </Button>
            </Restricted>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <LandscapeCard landscape={landscape} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupContextProvider
            owner={landscape}
            groupSlug={landscape.defaultGroup.slug}
            MemberJoinButton={MemberJoinButton}
            MemberLeaveButton={MemberLeaveButton}
          >
            <GroupMembershipCard
              onViewMembers={() =>
                navigate(`/landscapes/${landscape.slug}/members`)
              }
            />
          </GroupContextProvider>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default LandscapeView;
