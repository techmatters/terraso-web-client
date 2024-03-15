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
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken } from 'terraso-client-shared/account/auth';
import { useSelector } from 'terrasoApi/store';

import { generateReferrerUrl } from 'navigation/navigationUtils';

const getIsFirstLogin = async () => {
  const token = await getToken();
  return token === undefined ? undefined : jwtDecode(token).isFirstLogin;
};

const getStoredCompletedProfile = email => {
  const storedCompletedProfile = localStorage.getItem(
    'completedProfileDisplayed'
  );
  try {
    const parsed = JSON.parse(storedCompletedProfile);
    return parsed[email];
  } catch (error) {
    return false;
  }
};

export const profileCompleted = email => {
  if (!email) {
    return;
  }
  localStorage.setItem(
    'completedProfileDisplayed',
    JSON.stringify({
      [email]: true,
    })
  );
};

export const useCompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useSelector(state => state.account.currentUser);
  const [isFirstLogin, setIsFirstLogin] = useState();

  useEffect(() => {
    getIsFirstLogin().then(isFirstLogin => {
      setIsFirstLogin(isFirstLogin);
    });
  }, []);

  useEffect(() => {
    if (!isFirstLogin || !user?.email) {
      return;
    }

    const completedProfile = getStoredCompletedProfile(user?.email);
    if (completedProfile) {
      return;
    }

    if (location.pathname === '/account/profile/completeProfile') {
      return;
    }

    const to = generateReferrerUrl(
      '/account/profile/completeProfile',
      location
    );

    navigate(to);
  }, [isFirstLogin, user?.email, navigate, location]);
};
