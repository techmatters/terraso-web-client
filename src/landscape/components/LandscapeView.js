import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Link,
  Stack,
  Box,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import bbox from '@turf/bbox';

import { fetchLandscapeView } from 'landscape/landscapeSlice';
import { withProps } from 'react-hoc';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';
import PageLoader from 'common/components/PageLoader';
import Map from 'gis/components/Map';
import { GroupContextProvider } from 'group/groupContext';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import PageHeader from 'common/components/PageHeader';
import PageContainer from 'common/components/PageContainer';
import theme from 'theme';
import { useDocumentTitle } from 'common/document';

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

const LandscapeMap = ({ landscape }) => {
  const { t } = useTranslation();
  const { areaPolygon, position } = landscape;

  const areaBoundingBox = areaPolygon && bbox(areaPolygon);
  const positionBoundingBox = position && position.boundingbox;

  const boundingBox = areaBoundingBox || positionBoundingBox;
  const bounds = boundingBox && [
    [boundingBox[1], boundingBox[0]],
    [boundingBox[3], boundingBox[2]],
  ];

  return (
    <Box component="section" aria-label={t('landscape.view_map_title')}>
      <Map
        bounds={bounds}
        geojson={areaPolygon}
        style={{
          width: '100%',
          height: '400px',
        }}
      />
    </Box>
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
      <Typography
        variant="caption"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      >
        {landscape.location}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <LandscapeMap landscape={landscape} />
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
