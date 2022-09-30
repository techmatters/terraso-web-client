import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { useFetchData } from 'state/utils';

import { GroupContextProvider } from 'group/groupContext';
import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const LandscapeSharedDataVisualization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { landscapeSlug, configSlug } = useParams();
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
    <GroupContextProvider group={landscape.defaultGroup} owner={landscape}>
      <VisualizationWrapper
        configSlug={configSlug}
        groupSlug={landscape.defaultGroup.slug}
        onDeleted={() => navigate(`/landscapes/${landscapeSlug}`)}
      />
    </GroupContextProvider>
  );
};

export default LandscapeSharedDataVisualization;
