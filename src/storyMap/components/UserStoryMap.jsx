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
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';

import RouterButton from 'terraso-web-client/common/components/RouterButton';
import { useSocialShareContext } from 'terraso-web-client/common/components/SocialShare';
import { useDocumentTitle } from 'terraso-web-client/common/document';
import Container, {
  useContainerContext,
} from 'terraso-web-client/layout/Container';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import Restricted from 'terraso-web-client/permissions/components/Restricted';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';
import DeleteButton from 'terraso-web-client/storyMap/components/StoryMapDeleteButton';
import { fetchStoryMap } from 'terraso-web-client/storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapEmbedUrl,
  isChapterEmpty,
} from 'terraso-web-client/storyMap/storyMapUtils';

const UserStoryMap = () => {
  const navigate = useNavigate();
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
        embedUrl: storyMap ? generateStoryMapEmbedUrl(storyMap) : null,
        itemType: 'storyMap.item_type',
      }),
      [storyMap]
    )
  );

  const onDeleteSuccess = useCallback(() => navigate('/'), [navigate]);

  const chaptersFilter = useCallback(chapters => !isChapterEmpty(chapters), []);

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
          <DeleteButton
            storyMap={storyMap}
            onSuccess={onDeleteSuccess}
            buttonProps={{ variant: 'outlined', sx: { ml: 3 } }}
          >
            {t('storyMap.delete_label', { name: storyMap.title })}
          </DeleteButton>
        </Container>
      </Restricted>
      <StoryMap config={storyMap.config} chaptersFilter={chaptersFilter} />
    </>
  );
};

export default UserStoryMap;
