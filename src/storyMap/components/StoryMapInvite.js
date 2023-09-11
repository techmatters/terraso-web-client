/*
 * Copyright © 2023 Technology Matters
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
import { useCallback, useEffect, useMemo } from 'react';
import jwt from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Alert } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { approveMembershipToken } from 'storyMap/storyMapSlice';

const StoryMapInvite = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const decodedToken = useMemo(() => (token ? jwt(token) : null), [token]);
  const membershipId = useMemo(() => decodedToken.membershipId, [decodedToken]);
  const { processing, success, error, storyMap } =
    useSelector(state => state.storyMap.memberships.approve[membershipId]) ||
    {};

  useFetchData(
    useCallback(() => {
      return approveMembershipToken({
        token,
        accountEmail: decodedToken.email || decodedToken.pendingEmail,
        membership: { membershipId },
      });
    }, [token, decodedToken, membershipId])
  );

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    if (success) {
      dispatch(
        addMessage({
          severity: 'success',
          content: 'storyMap.approve_invite_success',
          params: {
            storyMapTitle: storyMap.title,
          },
        })
      );
    }

    if (error) {
      dispatch(
        addMessage({
          severity: 'error',
          content: 'storyMap.approve_invite_error',
        })
      );
    }
  }, [success, error, storyMap, dispatch, navigate]);

  useEffect(() => {
    if (!success) {
      return;
    }
    navigate(`/tools/story-maps/${storyMap.storyMapId}/${storyMap.slug}/edit`);
  }, [success, navigate, storyMap]);

  useDocumentTitle(t('storyMap.invite_document_title'));

  if (processing || !storyMap) {
    return <PageLoader />;
  }

  if (success) {
    return null;
  }

  return (
    <PageContainer>
      <Alert severity="error">{t('storyMap.approve_invite_error')}</Alert>
    </PageContainer>
  );
};

export default StoryMapInvite;
