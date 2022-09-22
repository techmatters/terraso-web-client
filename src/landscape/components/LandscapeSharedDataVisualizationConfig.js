import React, { useCallback, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import { GroupContextProvider } from 'group/groupContext';
import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import VisualizationConfigForm from 'sharedData/visualization/components/VisualizationConfigForm';

const LandscapeSharedDataVisualizationConfig = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { landscape, fetching } = useSelector(
    state => state.landscape.sharedDataUpload
  );

  useEffect(() => {
    dispatch(fetchLandscapeUpload(slug));
  }, [dispatch, slug]);

  const onCompleteSuccess = useCallback(
    visualizationId => {
      navigate(`/landscapes/${slug}/visualization/${visualizationId}`);
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
