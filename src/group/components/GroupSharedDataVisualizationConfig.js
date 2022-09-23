import React, { useCallback, useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupUpload } from 'group/groupSlice';
import VisualizationConfigForm from 'sharedData/visualization/components/VisualizationConfigForm';

const GroupSharedDataVisualizationConfig = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { group, fetching } = useSelector(
    state => state.group.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.map_create_document_title', {
      name: group?.name,
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ groupName: group?.name, loading: !group?.name }),
      [group?.name]
    )
  );

  useEffect(() => {
    dispatch(fetchGroupUpload(slug));
  }, [dispatch, slug]);

  const onCompleteSuccess = useCallback(
    visualizationId => {
      navigate(`/groups/${slug}/map/${visualizationId}`);
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
