/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { usePermissionRedirect } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
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
    navigate({
      pathname: `/landscapes/${slug}`,
      search: 'scrollTo=shared-data-card-title',
    });
  }, [navigate, slug]);

  const { loading } = usePermissionRedirect(
    'sharedData.add',
    landscape,
    useMemo(() => `/landscapes/${landscape?.slug}`, [landscape?.slug])
  );

  if (fetching || loading) {
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
      <CollaborationContextProvider owner={landscape} entityType="landscape">
        <SharedDataUpload
          onCancel={onCancel}
          onCompleteSuccess={onCompleteSuccess}
          targetInput={{
            targetType: 'landscape',
            targetSlug: slug,
          }}
        />
      </CollaborationContextProvider>
    </PageContainer>
  );
};

export default LandscapeSharedDataUpload;
