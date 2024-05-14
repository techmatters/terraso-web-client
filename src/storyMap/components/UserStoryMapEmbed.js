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
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Box, Link, Stack } from '@mui/material';

import { serialize } from 'common/components/RichTextEditor/utils';
import { useSocialShareContext } from 'common/components/SocialShare';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import StoryMap from 'storyMap/components/StoryMap';
import { fetchStoryMap } from 'storyMap/storyMapSlice';
import { generateStoryMapUrl, isChapterEmpty } from 'storyMap/storyMapUtils';

import logoWhite from 'assets/logo-white.svg';

const EmbedHeader = props => {
  const { t } = useTranslation();
  const { storyMap } = props;

  return (
    <Stack
      component={Link}
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      sx={{
        color: 'white',
        bgcolor: 'blue.dark3',
        zIndex: 2,
        position: 'fixed',
        width: '100%',
        fontSize: '12px',
      }}
      href={generateStoryMapUrl(storyMap)}
      target="_blank"
    >
      {t('storyMap.embed_header')}
      <Box
        component="img"
        src={logoWhite}
        height={16}
        width={62}
        alt={t('common.terraso_logoText')}
        sx={{ m: 1 }}
      />
    </Stack>
  );
};

const UserStoryMapEmbed = () => {
  const { t } = useTranslation();
  const { slug, storyMapId } = useParams();
  const { data: storyMap, fetching } = useSelector(_.get('storyMap.view'));

  useDocumentTitle(
    t('storyMap.view_document_title', {
      name: _.get('title', storyMap),
    }),
    fetching
  );

  useDocumentDescription(
    useMemo(() => {
      const description = serialize(
        storyMap?.config?.chapters?.[0]?.description
      );
      if (description) {
        return description;
      }
      return storyMap?.title;
    }, [storyMap?.config?.chapters, storyMap?.title]),
    fetching
  );

  useFetchData(
    useCallback(() => fetchStoryMap({ slug, storyMapId }), [slug, storyMapId])
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({
        title: storyMap?.title,
        loading: !storyMap?.title,
      }),
      [storyMap?.title]
    )
  );

  useSocialShareContext(
    useMemo(
      () => ({
        name: storyMap?.title,
      }),
      [storyMap?.title]
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
      <EmbedHeader storyMap={storyMap} />
      <StoryMap config={storyMap.config} chaptersFilter={chaptersFilter} />
    </>
  );
};

export default UserStoryMapEmbed;
