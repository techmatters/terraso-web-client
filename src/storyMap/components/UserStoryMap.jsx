/*
 * Copyright © 2021-2023 Technology Matters
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

import { useCallback, useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Stack, Typography } from '@mui/material';

import RouterButton from 'terraso-web-client/common/components/RouterButton';
import RouterLink from 'terraso-web-client/common/components/RouterLink';
import SocialShare, {
  useSocialShareContext,
} from 'terraso-web-client/common/components/SocialShare';
import { useDocumentTitle } from 'terraso-web-client/common/document';
import Container, {
  useContainerContext,
} from 'terraso-web-client/layout/Container';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { generateReferrerUrl } from 'terraso-web-client/navigation/navigationUtils';
import { usePermission } from 'terraso-web-client/permissions/index';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';
import { fetchStoryMap } from 'terraso-web-client/storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapEmbedUrl,
  isChapterEmpty,
} from 'terraso-web-client/storyMap/storyMapUtils';

const PublishedStoryMapActionBar = ({ storyMap }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const hasToken = useSelector(_.get('account.hasToken'));
  const { allowed: canChangeStoryMap, loading } = usePermission(
    'storyMap.change',
    storyMap
  );

  const joinUrl = useMemo(
    () => generateReferrerUrl('/account', location),
    [location]
  );

  const showJoinCta = !hasToken;
  const showEditButton = hasToken && !loading && canChangeStoryMap;

  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'blue.dark2',
        borderTop: theme => `1px solid ${theme.palette.gray.lite1}`,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: {
            xs: 3,
            md: 4,
          },
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          spacing={2}
          useFlexGap
          alignItems={{
            xs: 'center',
            md: 'center',
          }}
          justifyContent="center"
          sx={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          <SocialShare
            buttonLabel={t('storyMap.published_action_bar_share')}
            buttonProps={{
              variant: 'contained',
              startIcon: <ShareIcon />,
              sx: {
                bgcolor: 'secondary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'secondary.main',
                },
              },
            }}
          />
          {showJoinCta ? (
            <Typography color="white">
              <Trans i18nKey="storyMap.published_action_bar_join">
                prefix
                <RouterLink
                  to={joinUrl}
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                  }}
                >
                  join
                </RouterLink>
                suffix
              </Trans>
            </Typography>
          ) : null}
          {showEditButton ? (
            <RouterButton
              variant="outlined"
              to={generateStoryMapEditUrl(storyMap)}
            >
              {t('storyMap.view_edit')}
            </RouterButton>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

const UserStoryMap = () => {
  const { t } = useTranslation();
  const { slug, storyMapId } = useParams();
  const { data: storyMap, fetching } = useSelector(_.get('storyMap.view'));

  const { setContainerProps } = useContainerContext();

  useDocumentTitle(
    t('storyMap.view_document_title', {
      name: _.get('title', storyMap),
    }),
    fetching
  );

  useEffect(() => {
    setContainerProps({ maxWidth: false });
    return () => setContainerProps({});
  }, [setContainerProps]);

  useFetchData(
    useCallback(() => fetchStoryMap({ slug, storyMapId }), [slug, storyMapId])
  );

  useSocialShareContext(
    useMemo(
      () => ({
        name: storyMap?.title,
        embedUrl: storyMap ? generateStoryMapEmbedUrl(storyMap) : null,
        itemType: 'storyMap.item_type',
      }),
      [storyMap]
    )
  );

  const chaptersFilter = useCallback(chapters => !isChapterEmpty(chapters), []);

  if (fetching) {
    return <PageLoader />;
  }

  if (!storyMap) {
    return null;
  }

  return (
    <>
      <StoryMap config={storyMap.config} chaptersFilter={chaptersFilter} />
      <PublishedStoryMapActionBar storyMap={storyMap} />
    </>
  );
};

export default UserStoryMap;
