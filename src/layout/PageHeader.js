import React from 'react';

import { Typography } from '@mui/material';

const PageHeader = ({ header, children, typographyProps = {} }) => (
  <Typography
    variant="h1"
    sx={theme => ({ marginBottom: theme.spacing(3) })}
    {...typographyProps}
  >
    {header}
    {children}
  </Typography>
);

export default PageHeader;
