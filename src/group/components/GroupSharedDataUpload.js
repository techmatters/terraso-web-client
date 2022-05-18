import React, { useCallback, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';

import { fetchGroupUpload } from 'group/groupSlice';
import SharedDataUpload from 'sharedData/components/SharedDataUpload';

const GroupSharedDataUpload = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, group } = useSelector(
    state => state.group.sharedDataUpload
  );

  useEffect(() => {
    dispatch(fetchGroupUpload(slug));
  }, [dispatch, slug]);

  const onCompleteSuccess = useCallback(() => {
    navigate(`/groups/${slug}`);
  }, [navigate, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  const onCancel = () => {
    navigate(-1);
  };

  return (
    <PageContainer>
      <PageHeader
        header={t('group.shared_data_upload_title', { name: group.name })}
      />
      <SharedDataUpload
        groupSlug={slug}
        onCancel={onCancel}
        onCompleteSuccess={onCompleteSuccess}
      />
    </PageContainer>
  );
};

export default GroupSharedDataUpload;
