import React, { useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupUpload } from 'group/groupSlice';
import VisualizationWrapper from 'sharedData/visualization/components/VisualizationWrapper';

const GroupSharedDataVisualization = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groupSlug, configSlug } = useParams();
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
    dispatch(fetchGroupUpload(groupSlug));
  }, [dispatch, groupSlug]);

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
    <GroupContextProvider group={group} owner={group}>
      <VisualizationWrapper
        configSlug={configSlug}
        groupSlug={groupSlug}
        onDeleted={() => navigate(`/groups/${groupSlug}`)}
      />
    </GroupContextProvider>
  );
};

export default GroupSharedDataVisualization;
