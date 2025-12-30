/*
 * Copyright © 2024 Technology Matters
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

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';
import { useDispatch, useSelector } from 'terrasoApi/store';

import { generateReferrerUrl } from 'navigation/navigationUtils';

export const useCompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: user } = useSelector(state => state.account.currentUser);

  useEffect(() => {
    const email = user?.email;
    const needsFirstName = !user?.firstName?.trim();
    if (!email || !needsFirstName) {
      return;
    }

    if (location?.pathname.startsWith('/account/profile/completeProfile')) {
      return;
    }

    const to = generateReferrerUrl(
      '/account/profile/completeProfile',
      location
    );

    dispatch(
      addMessage({
        severity: 'warning',
        content: 'account.profile_complete_message',
      })
    );
    navigate(to, { replace: true });
  }, [user?.email, user?.firstName, dispatch, navigate, location]);
};
