import React, { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const LandscapeSharedDataVisualization = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug, configId } = useParams();
  const { landscape, fetching } = useSelector(
    state => state.landscape.sharedDataUpload
  );

  useEffect(() => {
    dispatch(fetchLandscapeUpload(slug));
  }, [dispatch, slug]);

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
    <PageContainer>
      <GroupContextProvider group={landscape.defaultGroup} owner={landscape}>
        <VisualizationWrapper
          configId={configId}
          onDeleted={() => navigate(`/landscapes/${slug}`)}
        />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default LandscapeSharedDataVisualization;
