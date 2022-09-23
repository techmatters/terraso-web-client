import React, { useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupUpload } from 'group/groupSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const GroupSharedDataVisualization = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug, configId } = useParams();
  const { group, fetching } = useSelector(
    state => state.group.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.map_view_document_title', {
      name: group?.name,
    }),
    fetching
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
