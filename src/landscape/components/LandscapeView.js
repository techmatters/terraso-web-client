import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

import { fetchLandscapeView } from 'landscape/landscapeSlice';
import GroupMembershipCard from 'group/components/GroupMembershipCard';
import PageLoader from 'common/components/PageLoader';
import Map from 'gis/components/Map';
import theme from 'theme';

const LandscapeCard = ({ landscape }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader
        title={t('landscape.view_card_title', { name: landscape.name })}
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

const LandscapeMap = ({ position }) => {
  const bounds = position && [
    [position.boundingbox[0], position.boundingbox[2]],
    [position.boundingbox[1], position.boundingbox[3]],
  ];
  return (
    <Map
      bounds={bounds}
      style={{
        width: '100%',
        height: '400px',
      }}
    />
  );
};

const LandscapeView = () => {
  const dispatch = useDispatch();
  const { landscape, fetching } = useSelector(state => state.landscape.view);
  const { slug } = useParams();

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
    <Box
      sx={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      }}
    >
      <Typography variant="h1">{landscape.name}</Typography>
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
          <LandscapeMap position={landscape.position} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LandscapeCard landscape={landscape} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupMembershipCard
            ownerName={landscape.name}
            groupSlug={landscape.defaultGroup.slug}
            joinLabel="landscape.view_join_label"
            leaveLabel="landscape.view_leave_label"
            messageText="landscape.membership_leave_confirm_message"
            messageTitle="landscape.membership_leave_confirm_title"
            confirmButtonLabel="landscape.membership_leave_confirm_button"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandscapeView;
