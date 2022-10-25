import { Link as ReactRouterLink } from 'react-router-dom';

import { Link } from '@mui/material';

const RouterLink = props => {
  return <Link component={ReactRouterLink} {...props} />;
};

export default RouterLink;
