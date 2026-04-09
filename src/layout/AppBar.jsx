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

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { signOut } from 'terraso-client-shared/account/accountSlice';
import { AppBar, Box, Button, Divider, Toolbar } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ConditionalLink from 'terraso-web-client/common/components/ConditionalLink';
import LocalePicker from 'terraso-web-client/localization/components/LocalePicker';
import { useOptionalAuth } from 'terraso-web-client/navigation/components/Routes';
import SkipLinks from 'terraso-web-client/navigation/components/SkipLinks';
import { generateReferrerUrl } from 'terraso-web-client/navigation/navigationUtils';
import AccountAvatar from 'terraso-web-client/account/components/AccountAvatar';

import logoSquare from 'terraso-web-client/assets/logo-square.svg';
import logo from 'terraso-web-client/assets/logo.svg';
import theme from 'terraso-web-client/theme';

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
    const to = generateReferrerUrl('/account', location);
    navigate(to);
  }, [location, navigate]);

  const hasUser = useMemo(() => user && hasToken, [user, hasToken]);

  if (!hasUser && !optionalAuthEnabled) {
    return null;
  }

  return (
    <AppBar
      position="static"
      sx={{ maxWidth: 1200, margin: '0 auto', backgroundColor: 'white' }}
    >
      <Toolbar sx={{ pt: { md: 3 }, pb: { md: 3 } }}>
        <SkipLinks />
        <ConditionalLink to="/" condition={!isHomePage}>
          <Box
            sx={{
              ml: {
                xm: '-64px',
              },
            }}
          >
            <img
              src={isSmall ? logoSquare : logo}
              width={isSmall ? 35 : 188}
              height={isSmall ? 35 : 53}
              alt={t('common.terraso_logoText')}
            />
          </Box>
        </ConditionalLink>
        <Box sx={{ flexGrow: 1 }} />
        {hasUser ? (
          <>
            <Button
              component={Link}
              to="/account/profile"
              startIcon={
                <AccountAvatar user={user} sx={{ width: 24, height: 24 }} />
              }
              sx={{
                fontWeight: 500,
                color: 'gray.dark2',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              {user.firstName} {user.lastName}
            </Button>
            <Divider
              flexItem
              variant="middle"
              aria-hidden="true"
              orientation="vertical"
              sx={{ backgroundColor: 'gray.mid2', mt: 2, mb: 2 }}
            />
            <Button
              color="inherit"
              sx={theme => ({
                marginRight: 2,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              })}
              onClick={onSignOut}
            >
              {t('user.sign_out')}
            </Button>
          </>
        ) : (
          <Button
            color="primary"
            sx={theme => ({ marginRight: 2 })}
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
