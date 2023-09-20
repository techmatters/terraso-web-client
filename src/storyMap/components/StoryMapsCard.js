/*
 * Copyright © 2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import React, { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'terrasoApi/store';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { LoadingButton } from '@mui/lab';
import {
  List as BaseList,
  Box,
  Chip,
  Divider,
  Grid,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

import { MEMBERSHIP_STATUS_PENDING } from 'collaboration/collaborationConstants';
import RouterButton from 'common/components/RouterButton';
import RouterLink from 'common/components/RouterLink';
import { formatDate } from 'localization/utils';
import Restricted from 'permissions/components/Restricted';
import HomeCard from 'home/components/HomeCard';
import { approveMembership, removeUserStoryMap } from 'storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'storyMap/storyMapUtils';

import DeleteButton from './StoryMapDeleteButton';

const List = withProps(BaseList, {
  component: withProps(Stack, {
    divider: <Divider aria-hidden="true" component="li" />,
    component: 'ul',
  }),
});

const GridListItem = withProps(Grid, { component: 'li' });

const CollaborationIndicator = props => {
  const { storyMap } = props;

  const {
    membershipsInfo: { membershipsSample: memberships },
  } = storyMap;

  if (_.isEmpty(memberships)) {
    return null;
  }

  return <PeopleIcon sx={{ color: 'gray.dark1' }} />;
};

const StoryMapListItem = props => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { storyMap } = props;

  const accountMembership = useMemo(
    () => storyMap.membershipsInfo.accountMembership,
    [storyMap.membershipsInfo.accountMembership]
  );

  const isPending = useMemo(
    () => accountMembership?.membershipStatus === MEMBERSHIP_STATUS_PENDING,
    [accountMembership]
  );

  const processing = useSelector(
    state =>
      state.storyMap.memberships.approve[accountMembership?.membershipId]
        ?.processing || false
  );

  const onAcceptWrapper = useCallback(() => {
    dispatch(
      approveMembership({
        membership: accountMembership,
        storyMap,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        const storyMapId = data.payload.storyMap.storyMapId;
        const storyMapSlug = data.payload.storyMap.slug;
        navigate(`/tools/story-maps/${storyMapId}/${storyMapSlug}/edit`);
      }
    });
  }, [dispatch, navigate, storyMap, accountMembership]);

  const onDeleteSuccess = useCallback(() => {
    dispatch(removeUserStoryMap(storyMap.id));
  }, [dispatch, storyMap.id]);

  return (
    <ListItem
      component={GridListItem}
      container
      aria-labelledby={`story-map-${storyMap.slug}-link`}
      sx={{ pr: 0, pl: 0 }}
    >
      <Stack
        component={Grid}
        item
        spacing={1}
        xs={8}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Stack direction="row" spacing={1}>
          {!storyMap.isPublished && (
            <Chip
              size="small"
              label={t('storyMap.home_draft_label')}
              sx={{
                borderRadius: 0,
                bgcolor: 'gray.dark1',
                color: 'white',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: '0.6rem',
                height: 'auto',
                pt: 0.25,
                pb: 0.25,
              }}
            />
          )}
          <CollaborationIndicator storyMap={storyMap} />
        </Stack>
        <RouterLink
          id={`story-map-${storyMap.slug}-link`}
          to={
            storyMap.isPublished
              ? generateStoryMapUrl(storyMap)
              : generateStoryMapEditUrl(storyMap)
          }
        >
          {storyMap.title}
        </RouterLink>
        <Typography
          variant="caption"
          sx={{
            fontStyle: 'italic',
          }}
        >
          {storyMap.isPublished && storyMap.publishedAt
            ? t('storyMap.home_published_on', {
                date: formatDate(i18n.resolvedLanguage, storyMap.publishedAt),
              })
            : t('storyMap.home_last_edited', {
                date: formatDate(i18n.resolvedLanguage, storyMap.updatedAt),
              })}
        </Typography>
      </Stack>
      <Grid
        container
        item
        xs={4}
        justifyContent="flex-end"
        direction="row"
        spacing={2}
      >
        <Grid item xs={6}>
          {isPending ? (
            <LoadingButton
              size="small"
              variant="outlined"
              sx={{ pr: 3, pl: 3 }}
              onClick={onAcceptWrapper}
              loading={processing}
            >
              {t('storyMap.home_accept')}
            </LoadingButton>
          ) : (
            <RouterButton
              to={generateStoryMapEditUrl(storyMap)}
              size="small"
              variant="outlined"
              sx={{ pr: 3, pl: 3 }}
            >
              {t('storyMap.home_edit')}
            </RouterButton>
          )}
        </Grid>
        <Grid item xs={6}>
          <Restricted
            permission="storyMap.delete"
            resource={storyMap}
            FallbackComponent={Box}
          >
            <DeleteButton
              storyMap={storyMap}
              tooltip={t('storyMap.delete_label')}
              onSuccess={onDeleteSuccess}
            >
              <DeleteIcon
                sx={{
                  color: 'secondary.main',
                }}
              />
            </DeleteButton>
          </Restricted>
        </Grid>
      </Grid>
    </ListItem>
  );
};

const StoryMapsCard = ({ title, storyMaps, showCreate = true }) => {
  const { t } = useTranslation();
  const action = useMemo(
    () =>
      showCreate && {
        label: t('storyMap.home_create'),
        to: 'tools/story-maps/new',
      },
    [t, showCreate]
  );

  return (
    <HomeCard
      title={title}
      titleId="story-maps-list-title"
      action={action}
      contentBackgroundColor="white"
    >
      <List aria-labelledby="story-maps-list-title" sx={{ width: '100%' }}>
        {storyMaps.map(storyMap => (
          <StoryMapListItem key={storyMap.id} storyMap={storyMap} />
        ))}
      </List>
    </HomeCard>
  );
};

export default StoryMapsCard;
