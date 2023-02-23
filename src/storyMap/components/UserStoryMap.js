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
import React, { useCallback, useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useSocialShareContext } from 'common/components/SocialShare';
import { useContainerContext } from 'layout/Container';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { useFetchData } from 'state/utils';

import StoryMap from 'storyMap/components/StoryMap';
import { fetchStoryMap } from 'storyMap/storyMapSlice';

const UserStoryMap = () => {
  const { slug } = useParams();
  const { data: storyMap, fetching } = useSelector(_.get('storyMap.view'));

  const { setContainerProps } = useContainerContext();

  useEffect(() => {
    setContainerProps({ maxWidth: false });
    return () => setContainerProps({});
  }, [setContainerProps]);

  useFetchData(useCallback(() => fetchStoryMap({ slug }), [slug]));

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

  if (fetching) {
    return <PageLoader />;
  }

  if (!storyMap) {
    return null;
  }

  return <StoryMap config={storyMap.config} />;
};

export default UserStoryMap;
