/*
 * Copyright © 2026 Technology Matters
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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import PeopleIcon from '@mui/icons-material/People';
import { Box, Card, Chip, ListItem, Stack, Typography } from '@mui/material';

import { MEMBERSHIP_STATUS_PENDING } from 'terraso-web-client/collaboration/collaborationConstants';
import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { formatDate } from 'terraso-web-client/localization/utils';
import StoryMapHomeListItemActions from 'terraso-web-client/storyMap/components/StoryMapHomeListItemActions';
import {
  getStoryMapImage,
  getStoryMapImageAlt,
  getTitleDestination,
  STORY_MAP_CARD_IMAGE_ASPECT_RATIO,
  STORY_MAP_CARD_IMAGE_WIDTH,
  STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY,
  STORY_MAP_FALLBACK_IMAGE,
  STORY_MAP_ROW_ACTIONS_IMAGE_WIDTH,
} from 'terraso-web-client/storyMap/components/storyMapHomeListItemUtils';

const TITLE_STYLES = {
  color: 'secondary.main',
  fontFamily: 'Lato, Helvetica, Arial, sans-serif',
  fontWeight: 700,
  fontSize: '20px',
  lineHeight: '23px',
  letterSpacing: '0.15px',
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
};

const META_STYLES = {
  color: 'secondary.main',
  fontFamily: 'Lato, Helvetica, Arial, sans-serif',
  fontSize: '14px',
  fontStyle: 'italic',
  fontWeight: 400,
  lineHeight: '20.02px',
  letterSpacing: '0.17px',
};

const DRAFT_CHIP_STYLES = {
  borderRadius: 0,
  bgcolor: 'gray.dark1',
  color: 'white',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: '0.5rem',
  height: 'auto',
  minHeight: 18,
  '& .MuiChip-label': {
    px: 0.75,
    py: 0.125,
  },
};

const CollaborationIndicator = ({ storyMap }) => {
  const { t } = useTranslation();

  const {
    membershipInfo: { memberships },
  } = storyMap;

  if (_.isEmpty(memberships)) {
    return null;
  }

  return (
    <PeopleIcon
      aria-label={t('storyMap.home_shared_label')}
      sx={{ color: 'text.secondary', flexShrink: 0, fontSize: 18 }}
    />
  );
};

const StoryMapHomeListItem = ({ storyMap }) => {
  const { t, i18n } = useTranslation();
  const storyMapConfig = storyMap.config;
  const [imageSrc, setImageSrc] = useState(() =>
    getStoryMapImage(storyMapConfig)
  );

  const handleImageError = useCallback(() => {
    if (imageSrc === STORY_MAP_FALLBACK_IMAGE) {
      return;
    }

    setImageSrc(STORY_MAP_FALLBACK_IMAGE);
  }, [imageSrc]);

  const accountMembership = useMemo(
    () => storyMap.membershipInfo.accountMembership,
    [storyMap.membershipInfo.accountMembership]
  );

  const isStoryMapMembershipPending = useMemo(
    () => accountMembership?.membershipStatus === MEMBERSHIP_STATUS_PENDING,
    [accountMembership]
  );

  const titleDestination = getTitleDestination({
    isStoryMapMembershipPending,
    storyMap,
  });
  const timestampLabel =
    storyMap.isPublished && storyMap.publishedAt
      ? t('storyMap.home_published_on', {
          date: formatDate(i18n.resolvedLanguage, storyMap.publishedAt),
        })
      : t('storyMap.home_last_edited', {
          date: formatDate(i18n.resolvedLanguage, storyMap.updatedAt),
        });

  return (
    <ListItem sx={{ p: 0 }}>
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          px: 2,
          py: 2,
          borderRadius: '8px',
          borderColor: 'rgba(0, 0, 0, 0.14)',
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: `${STORY_MAP_ROW_ACTIONS_IMAGE_WIDTH}px minmax(0, 1fr)`,
            },
            columnGap: { xs: 0, sm: 5 },
            rowGap: 2,
            alignItems: 'flex-start',
            [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
              gridTemplateColumns: `${STORY_MAP_CARD_IMAGE_WIDTH}px minmax(0, 1fr)`,
              columnGap: 3,
            },
          }}
        >
          <Box
            sx={{
              width: { xs: '100%', sm: STORY_MAP_ROW_ACTIONS_IMAGE_WIDTH },
              aspectRatio: STORY_MAP_CARD_IMAGE_ASPECT_RATIO,
              flexShrink: 0,
              overflow: 'hidden',
              borderRadius: '8px',
              bgcolor: 'grey.200',
              gridColumn: 1,
              gridRow: { xs: 'auto', sm: 1 },
              [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
                width: STORY_MAP_CARD_IMAGE_WIDTH,
              },
            }}
          >
            <Box
              component="img"
              src={imageSrc}
              alt={getStoryMapImageAlt(storyMapConfig, storyMap.title)}
              onError={handleImageError}
              sx={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              gridColumn: { xs: 1, sm: 2 },
              gridRow: { xs: 'auto', sm: 1 },
              alignSelf: 'stretch',
              [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                columnGap: 3,
              },
            }}
          >
            <Stack
              spacing={1}
              sx={{
                minWidth: 0,
                alignItems: 'flex-start',
                alignSelf: 'stretch',
                [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
                  gridColumn: 1,
                  gridRow: 1,
                },
              }}
            >
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'flex-start',
                  width: '100%',
                }}
              >
                {titleDestination ? (
                  <RouterLink
                    id={`story-map-${storyMap.slug}-link`}
                    to={titleDestination}
                    aria-label={storyMap.title}
                    sx={{
                      textDecoration: 'none',
                      minWidth: 0,
                      flexShrink: 1,
                      display: 'inline-flex',
                    }}
                  >
                    <Typography component="div" sx={TITLE_STYLES}>
                      {storyMap.title}
                    </Typography>
                  </RouterLink>
                ) : (
                  <Typography
                    id={`story-map-${storyMap.slug}-link`}
                    component="div"
                    sx={{ ...TITLE_STYLES, flexShrink: 1 }}
                  >
                    {storyMap.title}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    flexShrink: 0,
                    ml: 'auto',
                    pt: 0.25,
                  }}
                >
                  {!storyMap.isPublished && (
                    <Chip
                      size="small"
                      label={t('storyMap.home_draft_label')}
                      sx={DRAFT_CHIP_STYLES}
                    />
                  )}
                  <CollaborationIndicator storyMap={storyMap} />
                </Stack>
              </Stack>
              <Typography component="div" sx={META_STYLES}>
                {timestampLabel}
              </Typography>
            </Stack>
            <Box
              sx={{
                width: '100%',
                mt: 2,
                [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
                  width: 'auto',
                  mt: 0,
                  gridColumn: 2,
                  gridRow: 1,
                  alignSelf: 'stretch',
                },
              }}
            >
              <StoryMapHomeListItemActions
                isStoryMapMembershipPending={isStoryMapMembershipPending}
                storyMap={storyMap}
                storyMapConfig={storyMapConfig}
              />
            </Box>
          </Box>
        </Box>
      </Card>
    </ListItem>
  );
};

export default StoryMapHomeListItem;
