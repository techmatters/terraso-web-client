import React, { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupUpload } from 'group/groupSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const GroupSharedDataVisualization = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug, configId } = useParams();
  const { group, fetching } = useSelector(
    state => state.group.sharedDataUpload
  );

  useEffect(() => {
    dispatch(fetchGroupUpload(slug));
  }, [dispatch, slug]);

  useBreadcrumbsParams(
    useMemo(
      () => ({ groupName: group?.name, loading: !group?.name }),
      [group?.name]
    )
  );

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <GroupContextProvider group={group} owner={group}>
        <VisualizationWrapper
          configId={configId}
          onDeleted={() => navigate(`/groups/${slug}`)}
        />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default GroupSharedDataVisualization;
