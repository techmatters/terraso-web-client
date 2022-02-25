import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Button, Box, List, ListItem } from '@mui/material';

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
  padding: theme.spacing(2),
  textTransform: 'uppercase',
  color: theme.palette.gray.dark2,
  '&.MuiButton-root:hover': {
    backgroundColor: theme.palette.gray.lite1,
  },
  '&.Mui-selected': {
    color: theme.palette.black,
    fontWeight: theme.typography.fontWeightMedium,
    backgroundColor: 'inherit',
    borderBottom: '2px solid',
  },
}));

const NavigationLink = ({ path, selected }) => {
  const { t } = useTranslation();
  return (
    <ListItem disablePadding dense sx={{ width: 'auto' }}>
      <NavButton
        className={selected && 'Mui-selected'}
        component={RouterLink}
        to={path}
        value={path}
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
      component="nav"
      id="main-navigation"
      tabIndex="-1"
      ref={ref}
      value={value}
      aria-label={t('navigation.nav_label')}
      sx={{
        '& .MuiTabs-indicator': {
          backgroundColor: 'black',
        },
        maxWidth: 'lg',
        margin: '0 auto',
        padding: '0 24px',
        boxSizing: 'border-box',
      }}
    >
      <List sx={{ display: 'flex', flexDirection: 'row', padding: 0 }}>
        {Object.keys(PAGES).map((path, index) => (
          <NavigationLink key={path} path={path} selected={index === value} />
        ))}
      </List>
    </Box>
  );
});

export default Navigation;
