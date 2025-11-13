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
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import VisualizationConfigForm from 'sharedData/visualization/components/VisualizationConfigForm';

const LandscapeSharedDataVisualizationConfig = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { landscape, fetching } = useSelector(
    state => state.landscape.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.map_create_document_title', {
      name: landscape?.name,
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  useEffect(() => {
    dispatch(fetchLandscapeUpload(slug));
  }, [dispatch, slug]);

  const onCompleteSuccess = useCallback(
    visualizationConfig => {
      navigate(
        `/landscapes/${slug}/map/${visualizationConfig.readableId}/${visualizationConfig.slug}`
      );
    },
    [navigate, slug]
  );

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (fetching || landscape?.slug !== slug) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <CollaborationContextProvider owner={landscape} entityType="landscape">
        <VisualizationConfigForm
          onCompleteSuccess={onCompleteSuccess}
          onCancel={onCancel}
        />
      </CollaborationContextProvider>
    </PageContainer>
  );
};

export default LandscapeSharedDataVisualizationConfig;
