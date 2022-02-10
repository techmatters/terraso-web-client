import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { ToggleButton, Box, List, ListItem } from '@mui/material';

const PAGES = {
  '/': {
    label: 'navigation.home',
    match: path => path === '/',
  },
  '/landscapes': {
    label: 'navigation.landscapes',
    match: path => path.startsWith('/landscapes'),
  },
  '/groups': {
    label: 'navigation.groups',
    match: path => path.startsWith('/groups'),
  },
  '/tools': {
    label: 'navigation.tools',
    match: path => path.startsWith('/tools'),
  },
};

const NavButton = styled(ToggleButton)(({ theme }) => ({
  border: 0,
  borderRadius: 0,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  textTransform: 'uppercase',
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
    backgroundColor: 'inherit',
    borderBottom: '2px solid',
  },
}));

const Navigation = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user } = useSelector(state => state.account.currentUser);
  const hasToken = useSelector(state => state.account.hasToken);
  const location = useLocation();
  const [value, setValue] = React.useState(false);

  useEffect(() => {
    const currentValue = _.findIndex(
      path => path.match(location.pathname),
      Object.values(PAGES)
    );
    setValue(currentValue > -1 ? currentValue : false);
  }, [location]);

  if (!hasToken || !user) {
    return null;
  }

  const handleChange = (value, path) => {
    navigate(path);
    setValue(value);
  };

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
          <ListItem key={path} disablePadding dense sx={{ width: 'auto' }}>
            <NavButton
              component="a"
              value={path}
              selected={value === index}
              onClick={() => handleChange(index, path)}
            >
              {t(PAGES[path].label)}
            </NavButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
});

export default Navigation;
