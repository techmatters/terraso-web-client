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

import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useLocation } from 'react-router';
import { Box, Button, List, ListItem, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';

import Container from 'layout/Container';

const PAGES = {
  '/': {
    label: 'navigation.home',
    match: path => path === '/',
  },
  '/landscapes': {
    label: 'navigation.landscapes',
    match: path => /^\/landscapes(\/.*)?$/.test(path),
  },
  '/groups': {
    label: 'navigation.groups',
    match: path => /^\/groups(\/.*)?$/.test(path),
  },
  '/tools': {
    label: 'navigation.tools',
    match: path => /^\/tools(\/.*)?$/.test(path),
  },
};

const NavButton = styled(Button)(({ theme }) => ({
  border: 0,
  borderRadius: 0,
  padding: 0,
  paddingBottom: 1,
  textTransform: 'uppercase',
  fontFamily: 'Lato, Helvetica, Arial, sans-serif',
  fontSize: '1.125rem',
  lineHeight: '22px',
  marginTop: '-4px', // adjust for bottom border
  color: theme.palette.gray.dark2,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: '4px solid',
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  '&:hover': {
    background: 'transparent',
  },
}));

const NavigationLink = ({ path, selected, index }) => {
  const { t } = useTranslation();
  return (
    <ListItem
      disablePadding
      dense
      sx={{
        width: 'auto',
        padding: 1.5,
        paddingBottom: 0,
        ':hover': {
          backgroundColor: theme => theme.backgroundNavColor,
        },
        ':first-of-type': {
          marginLeft: -2,
        },
      }}
    >
      <NavButton
        className={selected && 'Mui-selected'}
        component={RouterLink}
        to={path}
        value={path}
        id={`main-navigation-${index}`}
        {...(selected ? { 'aria-current': 'page' } : {})}
      >
        {t(PAGES[path].label)}
      </NavButton>
    </ListItem>
  );
};

const Navigation = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const { data: user } = useSelector(state => state.account.currentUser);
  const hasToken = useSelector(state => state.account.hasToken);
  const location = useLocation();

  const value = _.findIndex(
    path => path.match(location.pathname),
    Object.values(PAGES)
  );

  if (!hasToken || !user) {
    return null;
  }

  return (
    <Box
      id="main-navigation"
      sx={{
        boxShadow: '0px 3px 4px 0px #0000001A',
        marginBottom: '4px',
      }}
    >
      <Container
        component="nav"
        tabIndex="-1"
        ref={ref}
        value={value}
        aria-label={t('navigation.nav_label_short')}
        sx={{
          maxWidth: {
            md: 1200,
          },
        }}
      >
        <Typography sx={visuallyHidden} variant="h2">
          {t('navigation.nav_label')}
        </Typography>
        <List
          sx={{
            display: 'flex',
            flexDirection: 'row',
            padding: 0,
          }}
        >
          {Object.keys(PAGES).map((path, index) => (
            <NavigationLink
              key={path}
              path={path}
              index={index}
              selected={index === value}
            />
          ))}
        </List>
      </Container>
    </Box>
  );
});

export default Navigation;
