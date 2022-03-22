import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Typography,
  Grid,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Link,
  Stack,
  Button,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LaunchIcon from '@mui/icons-material/Launch';

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

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.view_leave_label',
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
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader
              variant="h2"
              title={landscape.location}
              titleTypographyProps={{ variant: 'h2' }}
            />
            <CardContent>
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
                        <Link
                          href={t('landscape.view_map_boundaries_help_url')}
                          target="_blank"
                        >
                          link
                          <LaunchIcon
                            fontSize="small"
                            sx={{ verticalAlign: 'bottom' }}
                          />
                        </Link>
                        .
                      </Trans>
                    ),
                  },
                ]}
              />
            </CardContent>
            <Restricted permission="landscape.change" resource={landscape}>
              <CardActions>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to={`/landscapes/${landscape.slug}/boundaries`}
                  sx={{ marginTop: 2 }}
                >
                  {t('landscape.view_map_boundaries_update')}
                </Button>
              </CardActions>
            </Restricted>
          </Card>
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
