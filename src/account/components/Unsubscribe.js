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
import { useSearchParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { addMessage } from 'notifications/notificationsSlice';
import { useFetchData } from 'state/utils';

import { unsubscribeFromNotifications } from 'account/accountSlice';

const Unsubscribe = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasToken = useSelector(_.get('account.hasToken'));
  const { processing, success, error } = useSelector(
    _.get('account.unsubscribe')
  );
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { trackEvent } = useAnalytics();

  useFetchData(useCallback(() => unsubscribeFromNotifications(token), [token]));

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
      trackEvent('Preference', { props: { emailNotifications: 'false' } });
    }

    if (error) {
      dispatch(
        addMessage({
          severity: 'error',
          content: 'account.unsubscribe_error',
        })
      );
    }
    if (hasToken) {
      navigate('/');
    }
  }, [success, error, dispatch, navigate, trackEvent, hasToken]);

  useDocumentTitle(t('account.unsubscribe_title'));

  if (processing) {
    return <PageLoader />;
  }

  return (
    <Typography>
      {success
        ? t('account.unsubscribe_success')
        : t('account.unsubscribe_error')}
    </Typography>
  );
};

export default Unsubscribe;
