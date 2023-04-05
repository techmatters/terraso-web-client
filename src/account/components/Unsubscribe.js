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
import { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { addMessage } from 'notifications/notificationsSlice';
import { useFetchData } from 'state/utils';

import { savePreference } from 'account/accountSlice';

const Unsubscribe = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { saving, success, error } = useSelector(_.get('account.preferences'));

  useFetchData(
    useCallback(
      () => savePreference({ key: 'notifications', value: 'false' }),
      []
    )
  );

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    if (success) {
      dispatch(
        addMessage({
          severity: 'success',
          content: 'account.unsubscribe_success',
        })
      );
    }

    if (error) {
      dispatch(
        addMessage({
          severity: 'error',
          content: 'account.unsubscribe_error',
        })
      );
    }
    navigate('/');
  }, [success, error, dispatch, navigate]);

  useDocumentTitle(t('account.unsubscribe_title'));

  if (saving) {
    return <PageLoader />;
  }

  return null;
};

export default Unsubscribe;
