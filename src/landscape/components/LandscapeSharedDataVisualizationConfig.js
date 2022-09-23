import React, { useCallback, useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
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
    visualizationId => {
      navigate(`/landscapes/${slug}/map/${visualizationId}`);
    },
    [navigate, slug]
  );

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <GroupContextProvider group={landscape.defaultGroup} owner={landscape}>
        <VisualizationConfigForm
          onCompleteSuccess={onCompleteSuccess}
          onCancel={onCancel}
        />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default LandscapeSharedDataVisualizationConfig;
