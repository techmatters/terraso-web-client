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
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { AppBar, Box, Button, Toolbar } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ConditionalLink from 'common/components/ConditionalLink';
import LocalePicker from 'localization/components/LocalePicker';
import { useOptionalAuth } from 'navigation/components/Routes';
import SkipLinks from 'navigation/components/SkipLinks';
import { generateReferrerPath } from 'navigation/navigationUtils';
import { signOut } from 'state/account/accountSlice';

import AccountAvatar from 'account/components/AccountAvatar';

import logoSquare from 'assets/logo-square.svg';
import logo from 'assets/logo.svg';

import theme from 'theme';

const AppBarComponent = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enabled: optionalAuthEnabled } = useOptionalAuth();
  const { data: user } = useSelector(state => state.account.currentUser);
  const hasToken = useSelector(state => state.account.hasToken);
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const onSignOut = useCallback(() => {
    dispatch(signOut());
  }, [dispatch]);

  const onSignIn = useCallback(() => {
    const referrer = generateReferrerPath(location);
    const to = referrer ? `/account?referrer=${referrer}` : '/account';
    navigate(to);
  }, [location, navigate]);

  const hasUser = useMemo(() => user && hasToken, [user, hasToken]);

  if (!hasUser && !optionalAuthEnabled) {
    return null;
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <SkipLinks />
        <ConditionalLink to="/" condition={!isHomePage}>
          <img
            src={isSmall ? logoSquare : logo}
            width={isSmall ? 35 : 125}
            height="35"
            alt={t('common.terraso_logoText')}
          />
        </ConditionalLink>
        <Box sx={{ flexGrow: 1 }} />
        {hasUser ? (
          <>
            <Button
              component={Link}
              to="/account/profile"
              color="inherit"
              startIcon={
                <AccountAvatar user={user} sx={{ width: 24, height: 24 }} />
              }
              sx={{ fontWeight: 500 }}
            >
              {user.firstName} {user.lastName}
            </Button>
            <span aria-hidden="true">|</span>
            <Button
              color="inherit"
              sx={theme => ({ marginRight: theme.spacing(2) })}
              onClick={onSignOut}
            >
              {t('user.sign_out')}
            </Button>
          </>
        ) : (
          <Button
            color="primary"
            sx={theme => ({ marginRight: theme.spacing(2) })}
            onClick={onSignIn}
          >
            {t('user.sign_in')}
          </Button>
        )}
        <LocalePicker />
      </Toolbar>
    </AppBar>
  );
};

export default AppBarComponent;
