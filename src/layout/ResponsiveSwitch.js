import useMediaQuery from '@mui/material/useMediaQuery';

import theme from 'theme';

const ResponsiveSwitch = props => {
  const { desktop, mobile } = props;
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  if (isSmall) {
    return mobile;
  }
  return desktop;
};

export default ResponsiveSwitch;
