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

import { useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Stack } from '@mui/material';

import { useDocumentTitle } from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import { fetchFeaturedStoryMaps } from 'terraso-web-client/home/homeSlice';
import FeaturedStoryMapsSection from 'terraso-web-client/storyMap/components/FeaturedStoryMapsSection';
import StoryMapsCard, {
  STORY_MAP_CARD_VARIANTS,
} from 'terraso-web-client/storyMap/components/StoryMapsCard';
import StoryMapsEditorCard from 'terraso-web-client/storyMap/components/StoryMapsEditorCard';
import { fetchUserStoryMaps } from 'terraso-web-client/storyMap/storyMapSlice';

const StoryMapsToolsHome = () => {
  const { t } = useTranslation();
  const { list, fetching: fetchingStoryMaps } = useSelector(
    _.get('storyMap.userStoryMaps')
  );
  const { featuredStoryMaps } = useSelector(state => state.userHome);

  useDocumentTitle(t('storyMap.home_document_title'));
  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));
  useFetchData(fetchUserStoryMaps);
  useFetchData(fetchFeaturedStoryMaps);

  return (
    <>
      {fetchingStoryMaps && <PageLoader />}
      <PageContainer maxWidth="lg" sx={{ paddingTop: 4 }}>
        <Stack spacing={3} sx={{ width: '100%' }}>
          <StoryMapsCard
            title={t('storyMap.tool_home_title')}
            variant={STORY_MAP_CARD_VARIANTS.DASHBOARD_FEATURE}
          />
          {!fetchingStoryMaps && !_.isEmpty(list) && (
            <StoryMapsEditorCard storyMaps={list} />
          )}
        </Stack>
      </PageContainer>
      <FeaturedStoryMapsSection storyMaps={featuredStoryMaps} />
    </>
  );
};

export default StoryMapsToolsHome;
