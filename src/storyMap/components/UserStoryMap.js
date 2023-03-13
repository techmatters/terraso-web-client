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
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import RouterButton from 'common/components/RouterButton';
import { useSocialShareContext } from 'common/components/SocialShare';
import Container, { useContainerContext } from 'layout/Container';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import { useFetchData } from 'state/utils';

import StoryMap from 'storyMap/components/StoryMap';
import { fetchStoryMap } from 'storyMap/storyMapSlice';
import { generateStoryMapEditUrl } from 'storyMap/storyMapUtils';

const UserStoryMap = () => {
  const { t } = useTranslation();
  const { slug, urlIdentifier } = useParams();
  const { data: storyMap, fetching } = useSelector(_.get('storyMap.view'));

  const { setContainerProps } = useContainerContext();

  useEffect(() => {
    setContainerProps({ maxWidth: false });
    return () => setContainerProps({});
  }, [setContainerProps]);

  useFetchData(
    useCallback(
      () => fetchStoryMap({ slug, urlIdentifier }),
      [slug, urlIdentifier]
    )
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

  if (fetching) {
    return <PageLoader />;
  }

  if (!storyMap) {
    return null;
  }

  return (
    <>
      <Restricted permission="storyMap.change" resource={storyMap}>
        <Container
          sx={{ bgcolor: 'white', zIndex: 2, position: 'relative', pb: 2 }}
        >
          <RouterButton
            variant="outlined"
            to={generateStoryMapEditUrl(storyMap)}
          >
            {t('storyMap.view_edit')}
          </RouterButton>
        </Container>
      </Restricted>
      <StoryMap config={storyMap.config} />
    </>
  );
};

export default UserStoryMap;
