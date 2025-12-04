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

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const LandscapeSharedDataVisualization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { landscapeSlug, configSlug, readableId } = useParams();
  const { landscape, fetching } = useSelector(
    state => state.landscape.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.map_view_document_title', {
      name: landscape?.name,
    }),
    fetching
  );

  useFetchData(
    useCallback(() => fetchLandscapeUpload(landscapeSlug), [landscapeSlug])
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <CollaborationContextProvider owner={landscape} entityType="landscape">
      <VisualizationWrapper
        configSlug={configSlug}
        readableId={readableId}
        onDeleted={() => navigate(`/landscapes/${landscapeSlug}`)}
      />
    </CollaborationContextProvider>
  );
};

export default LandscapeSharedDataVisualization;
