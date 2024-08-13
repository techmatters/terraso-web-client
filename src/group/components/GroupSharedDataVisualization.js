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

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
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
    <CollaborationContextProvider owner={group} entityType="group">
      <VisualizationWrapper
        configSlug={configSlug}
        groupSlug={groupSlug}
        onDeleted={() => navigate(`/groups/${groupSlug}`)}
      />
    </CollaborationContextProvider>
  );
};

export default GroupSharedDataVisualization;
