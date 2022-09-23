import React, { useCallback, useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { fetchLandscapeUpload } from 'landscape/landscapeSlice';
import SharedDataUpload from 'sharedData/components/SharedDataUpload';

const LandscapeSharedDataUpload = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, landscape } = useSelector(
    state => state.landscape.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.upload_title', {
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

  const onCompleteSuccess = useCallback(() => {
    navigate(`/landscapes/${slug}`);
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
        header={t('landscape.shared_data_upload_title', {
          name: landscape.name,
        })}
      />
      <SharedDataUpload
        groupSlug={_.get('defaultGroup.slug', landscape)}
        onCancel={onCancel}
        onCompleteSuccess={onCompleteSuccess}
      />
    </PageContainer>
  );
};

export default LandscapeSharedDataUpload;
