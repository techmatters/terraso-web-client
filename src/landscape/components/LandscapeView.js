import React, { useCallback, useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import EmailIcon from '@mui/icons-material/Email';
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
  Paper,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import InlineHelp from 'common/components/InlineHelp';
import RouterLink from 'common/components/RouterLink';
import SocialShare from 'common/components/SocialShare.js';
import { useDocumentTitle } from 'common/document';
import { countryNameForCode } from 'common/utils';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useRefreshProgressContext } from 'layout/RefreshProgressProvider';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import { useFetchData } from 'state/utils';

import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';
import LandscapeMap from 'landscape/components/LandscapeMap';
import {
  fetchLandscapeView,
  refreshLandscapeView,
} from 'landscape/landscapeSlice';
import { isBoundaryPin } from 'landscape/landscapeUtils';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import SharedDataCard from 'sharedData/components/SharedDataCard';

import { withProps } from 'react-hoc';

import { Partnership } from './LandscapeProfile/AffiliationCard';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.view_leave_label',
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'landscape.view_join_label',
});

const Affiliation = props => {
  const { t } = useTranslation();
  const { landscape } = props;

  const {
    landscape: { partnership, partnershipStatus },
  } = props;

  if (!partnership || partnershipStatus === 'no') {
    return null;
  }

  return (
    <>
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2">
            {t('landscape.profile_affiliation_card_title')}
          </Typography>
        }
      />
      <Partnership landscape={landscape} />
    </>
  );
};

const LandscapeAboutCard = ({ landscape }) => {
  const { t } = useTranslation();
  return (
    <Card
      component="section"
      aria-labelledby="landscape-view-card-title"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
      }}
    >
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
      <CardContent component={Stack} sx={{ display: 'flex', flexGrow: 1 }}>
        {landscape.email && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <EmailIcon sx={{ color: 'gray.lite1' }} />
            <Link href={`mailto:${landscape.email}`}>{landscape.email}</Link>
          </Stack>
        )}
        {landscape.website && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon sx={{ color: 'gray.lite1' }} />
            <Link
              href={landscape.website}
              underline="none"
              className="wrap-url"
            >
              {landscape.website}
            </Link>
          </Stack>
        )}
      </CardContent>
      <Affiliation landscape={landscape} />
      <CardContent>
        <RouterLink to={`/landscapes/${landscape.slug}/profile`}>
          {t('landscape.view_card_title_profile_link')}
        </RouterLink>
      </CardContent>
    </Card>
  );
};

const BoundaryIcon = () => (
  <SvgIcon viewBox="0 0 50 14" sx={{ width: '50px' }} aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.25"
        y="0.25"
        width="48.6703"
        height="13.5"
        fill={theme.palette.map.polygonFill}
        stroke={theme.palette.map.polygon}
        strokeWidth="0.5"
      />
    </svg>
  </SvgIcon>
);

const LandscapeBoundaryDownload = props => {
  const { t } = useTranslation();
  const { landscape } = props;
  const { areaPolygon, slug } = landscape;

  const url = useMemo(
    () =>
      URL.createObjectURL(
        new Blob([JSON.stringify(areaPolygon)], {
          type: 'application/geo+json',
        })
      ),
    [areaPolygon]
  );

  const isPin = useMemo(() => isBoundaryPin(landscape), [landscape]);

  if (!areaPolygon || isPin) {
    return null;
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
      sx={{ p: 2 }}
    >
      <Stack direction="row" spacing={1}>
        <BoundaryIcon />
        <Typography>{t('landscape.view_boundary_download_label')}</Typography>
      </Stack>
      <Button
        variant="outlined"
        component="a"
        href={url}
        download={`${slug}.geojson`}
      >
        {t('landscape.view_boundary_download_button')}
      </Button>
    </Stack>
  );
};

const LandscapeView = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setRefreshing } = useRefreshProgressContext();
  const { landscape, fetching, refreshing } = useSelector(
    state => state.landscape.view
  );
  const { slug } = useParams();

  useDocumentTitle(
    t('landscape.view_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  useFetchData(useCallback(() => fetchLandscapeView(slug), [slug]));

  const updateLandscape = useCallback(() => {
    dispatch(refreshLandscapeView(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    setRefreshing(refreshing);
  }, [refreshing, setRefreshing]);

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
      baseOwnerUrl={`/landscapes/${landscape.slug}`}
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
            marginBottom: 1,
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
                <Paper variant="outlined" sx={{ mb: 2 }}>
                  <LandscapeMap
                    areaPolygon={landscape.areaPolygon}
                    boundingBox={landscape.boundingBox}
                    label={t('landscape.view_map_title')}
                  />
                  <LandscapeBoundaryDownload landscape={landscape} />
                </Paper>
                <InlineHelp
                  items={[
                    {
                      title: t('landscape.view_map_boundaries_help'),
                      details: (
                        <Trans i18nKey="landscape.view_map_boundaries_help_details">
                          Prefix
                          <ExternalLink
                            href={t('landscape.view_map_boundaries_help_url')}
                          >
                            link
                            <LaunchIcon
                              fontSize="small"
                              sx={{ verticalAlign: 'bottom' }}
                            />
                          </ExternalLink>
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
          <Grid item xs={12} md={6} style={{ display: 'flex' }}>
            <LandscapeAboutCard landscape={landscape} />
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            style={{ display: 'flex', alignItems: 'flex-start' }}
          >
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
              onAddVisualizationClick={() =>
                navigate(`/landscapes/${landscape.slug}/map/new`)
              }
            />
          </Grid>
        </Grid>
      </PageContainer>
    </GroupContextProvider>
  );
};

export default LandscapeView;
