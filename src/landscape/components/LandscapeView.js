import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import LaunchIcon from '@mui/icons-material/Launch';
import PublicIcon from '@mui/icons-material/Public';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import InlineHelp from 'common/components/InlineHelp';
import SocialShare from 'common/components/SocialShare.js';
import { useDocumentTitle } from 'common/document';
import { countryNameForCode } from 'common/utils';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import Restricted from 'permissions/components/Restricted';

import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';
import LandscapeMap from 'landscape/components/LandscapeMap';
import {
  fetchLandscapeView,
  refreshLandscapeView,
} from 'landscape/landscapeSlice';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import SharedDataCard from 'sharedData/components/SharedDataCard';

import { withProps } from 'react-hoc';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  renderLabel: () => 'landscape.view_leave_label',
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
          <Typography
            variant="h2"
            id="landscape-view-card-title"
            sx={{ paddingTop: 0 }}
          >
            {t('landscape.view_card_title', { name: landscape.name })}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {landscape.description}
        </Typography>
        {landscape.website && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon sx={{ color: 'gray.lite1' }} />
            <Link href={landscape.website} underline="none">
              {landscape.website}
            </Link>
          </Stack>
        )}
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/edit`}
            sx={{
              marginTop: theme.spacing(1),
            }}
          >
            {t('landscape.view_update_button')}
          </Button>
        </Restricted>
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

  const updateLandscape = useCallback(() => {
    dispatch(refreshLandscapeView(slug));
  }, [dispatch, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  if (!landscape) {
    return null;
  }

  const currentCountry = countryNameForCode(landscape.location);

  return (
    <GroupContextProvider
      owner={landscape}
      group={landscape.defaultGroup}
      groupSlug={landscape.defaultGroup.slug}
      MemberJoinButton={MemberJoinButton}
      MemberLeaveButton={MemberLeaveButton}
      updateOwner={updateLandscape}
    >
      <PageContainer>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{
            marginBottom: theme.spacing(3),
          }}
        >
          <div>
            <PageHeader
              header={landscape.name}
              typographyProps={{ sx: { marginBottom: 0 } }}
            />
            <Typography variant="body2" sx={{ marginBottom: 2 }}>
              {currentCountry?.name}
            </Typography>
          </div>
          <SocialShare name={landscape.name} />
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Card variant="outlined">
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
                <CardActions sx={{ paddingTop: 0 }}>
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to={`/landscapes/${landscape.slug}/boundaries`}
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
            <GroupMembershipCard
              onViewMembers={() =>
                navigate(`/landscapes/${landscape.slug}/members`)
              }
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <SharedDataCard
              onUploadClick={() =>
                navigate(`/landscapes/${landscape.slug}/upload`)
              }
            />
          </Grid>
        </Grid>
      </PageContainer>
    </GroupContextProvider>
  );
};

export default LandscapeView;
