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

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { signOut } from 'terraso-client-shared/account/accountSlice';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ConditionalLink from 'terraso-web-client/common/components/ConditionalLink';
import LocalePicker from 'terraso-web-client/localization/components/LocalePicker';
import Navigation from 'terraso-web-client/navigation/components/Navigation';
import { useOptionalAuth } from 'terraso-web-client/navigation/components/Routes';
import SkipLinks from 'terraso-web-client/navigation/components/SkipLinks';
import { generateReferrerUrl } from 'terraso-web-client/navigation/navigationUtils';
import AccountAvatar from 'terraso-web-client/account/components/AccountAvatar';

import storyMapsLogo from 'terraso-web-client/assets/logo-story-maps.svg';

const MAIN_NAVIGATION_BREAKPOINT = 950;
export const MAIN_NAVIGATION_DESKTOP_QUERY = `(min-width:${MAIN_NAVIGATION_BREAKPOINT}px)`;
const MAIN_NAVIGATION_MOBILE_QUERY = `(max-width:${MAIN_NAVIGATION_BREAKPOINT - 0.05}px)`;
const NARROW_MOBILE_QUERY = '(max-width:299px)';

const AccountMenuItems = ({ actions, onClose }) => (
  <>
    {actions.map(action => (
      <MenuItem
        key={action.id}
        component={action.to ? Link : 'li'}
        to={action.to}
        onClick={() => {
          onClose();
          action.onClick?.();
        }}
      >
        {action.label}
      </MenuItem>
    ))}
  </>
);

const AppBarComponent = ({ showInlineNavigation = true }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enabled: optionalAuthEnabled } = useOptionalAuth();
  const { data: user } = useSelector(state => state.account.currentUser);
  const hasToken = useSelector(state => state.account.hasToken);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isSmall = useMediaQuery(MAIN_NAVIGATION_MOBILE_QUERY);
  const isNarrowMobile = useMediaQuery(NARROW_MOBILE_QUERY);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [navigationMenuAnchor, setNavigationMenuAnchor] = useState(null);

  const onSignOut = useCallback(() => {
    dispatch(signOut());
  }, [dispatch]);

  const onSignIn = useCallback(() => {
    const to = generateReferrerUrl('/account', location);
    navigate(to);
  }, [location, navigate]);

  const hasUser = useMemo(() => user && hasToken, [user, hasToken]);
  const usesCompactHeader = hasUser && isSmall && isNarrowMobile;

  const onOpenAccountMenu = useCallback(event => {
    setAccountMenuAnchor(event.currentTarget);
  }, []);

  const onCloseAccountMenu = useCallback(() => {
    setAccountMenuAnchor(null);
  }, []);

  const onOpenNavigationMenu = useCallback(event => {
    setNavigationMenuAnchor(event.currentTarget);
  }, []);

  const onCloseNavigationMenu = useCallback(() => {
    setNavigationMenuAnchor(null);
  }, []);

  const accountDisplayName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const accountActions = useMemo(
    () => [
      {
        id: 'profile',
        label: accountDisplayName,
        to: '/account/profile',
      },
      {
        id: 'signOut',
        label: t('user.sign_out'),
        onClick: onSignOut,
      },
    ],
    [accountDisplayName, t, onSignOut]
  );

  if (!hasUser && !optionalAuthEnabled) {
    return null;
  }

  return (
    <AppBar
      position="static"
      sx={{ maxWidth: 1200, margin: '0 auto', backgroundColor: 'white' }}
    >
      <Toolbar sx={{ pt: { xs: 1.5, md: 2.5 }, pb: { xs: 0.75, md: 1.25 } }}>
        <SkipLinks />
        <ConditionalLink to="/" condition={!isHomePage}>
          <Box
            component="img"
            src={storyMapsLogo}
            alt={t('common.terraso_logoText')}
            sx={{
              display: 'block',
              width: {
                xs: 130,
                sm: 150,
                md: 160,
                lg: 170,
              },
              '@media (max-width:299px)': {
                width: 96,
              },
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </ConditionalLink>
        {showInlineNavigation && <Navigation inline />}
        <Box sx={{ flexGrow: 1 }} />
        {hasUser ? (
          <>
            {isSmall ? (
              <>
                {!usesCompactHeader && (
                  <>
                    <IconButton
                      aria-label={t('account.profile')}
                      onClick={onOpenAccountMenu}
                      sx={{ mr: 1 }}
                    >
                      <AccountAvatar
                        user={user}
                        sx={{ width: 28, height: 28 }}
                      />
                    </IconButton>
                    <Menu
                      anchorEl={accountMenuAnchor}
                      open={Boolean(accountMenuAnchor)}
                      onClose={onCloseAccountMenu}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <AccountMenuItems
                        actions={accountActions}
                        onClose={onCloseAccountMenu}
                      />
                    </Menu>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to={accountActions[0].to}
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
                  {accountActions[0].label}
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
                  sx={{
                    marginRight: 2,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={accountActions[1].onClick}
                >
                  {accountActions[1].label}
                </Button>
              </>
            )}
          </>
        ) : (
          <Button color="primary" sx={{ marginRight: 2 }} onClick={onSignIn}>
            {t('user.sign_in')}
          </Button>
        )}
        {!usesCompactHeader && <LocalePicker />}
        {hasUser && isSmall && (
          <>
            <IconButton
              aria-label={t('navigation.nav_label_short')}
              onClick={onOpenNavigationMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={navigationMenuAnchor}
              open={Boolean(navigationMenuAnchor)}
              onClose={onCloseNavigationMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Navigation mobile onNavigate={onCloseNavigationMenu} />
              {usesCompactHeader && [
                <Divider key="account-actions-divider" />,
                <Box
                  component="li"
                  key="locale-picker"
                  sx={{ px: 2, py: 1, listStyle: 'none' }}
                >
                  <LocalePicker />
                </Box>,
                <AccountMenuItems
                  key="account-menu-items"
                  actions={accountActions}
                  onClose={onCloseNavigationMenu}
                />,
              ]}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppBarComponent;
