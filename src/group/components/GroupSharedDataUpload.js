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
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document.js';
import PageContainer from 'layout/PageContainer.js';
import PageHeader from 'layout/PageHeader.js';
import PageLoader from 'layout/PageLoader.js';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext.js';
import { GroupContextProvider } from 'group/groupContext.js';
import { fetchGroupUpload } from 'group/groupSlice.ts';
import SharedDataUpload from 'sharedData/components/SharedDataUpload/index.js';

const GroupSharedDataUpload = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, group } = useSelector(
    state => state.group.sharedDataUpload
  );

  useDocumentTitle(
    t('sharedData.upload_title', {
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

  const onCompleteSuccess = useCallback(() => {
    navigate(`/groups/${slug}`);
  }, [navigate, slug]);

  const { loading } = usePermissionRedirect(
    'sharedData.add',
    group,
    useMemo(() => `/groups/${group?.slug}`, [group?.slug])
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
        header={t('group.shared_data_upload_title', { name: group.name })}
      />
      <GroupContextProvider owner={group}>
        <SharedDataUpload
          targetInput={{
            targetType: 'group',
            targetSlug: slug,
          }}
          onCancel={onCancel}
          onCompleteSuccess={onCompleteSuccess}
        />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default GroupSharedDataUpload;
