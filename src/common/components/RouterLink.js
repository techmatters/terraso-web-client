import React from 'react';

import { Link as ReactRouterLink } from 'react-router-dom';

import { Link } from '@mui/material';

const RouterLink = React.forwardRef((props, ref) => {
  return <Link ref={ref} component={ReactRouterLink} {...props} />;
});

export default RouterLink;
