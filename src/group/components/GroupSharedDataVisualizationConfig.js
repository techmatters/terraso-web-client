import React, { useCallback, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupUpload } from 'group/groupSlice';
import VisualizationConfigForm from 'sharedData/visualization/components/VisualizationConfigForm';

const GroupSharedDataVisualizationConfig = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { group, fetching } = useSelector(
    state => state.group.sharedDataUpload
  );

  useEffect(() => {
    dispatch(fetchGroupUpload(slug));
  }, [dispatch, slug]);

  const onCompleteSuccess = useCallback(
    visualizationId => {
      navigate(`/groups/${slug}/visualization/${visualizationId}`);
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
      <GroupContextProvider group={group} owner={group}>
        <VisualizationConfigForm
          onCompleteSuccess={onCompleteSuccess}
          onCancel={onCancel}
        />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default GroupSharedDataVisualizationConfig;
