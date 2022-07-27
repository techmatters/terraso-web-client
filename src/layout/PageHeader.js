import React from 'react';

import { Typography } from '@mui/material';

const PageHeader = ({ header, typographyProps = {} }) => (
  <Typography
    variant="h1"
    id="main-heading"
    sx={theme => ({ marginBottom: theme.spacing(3) })}
    {...typographyProps}
  >
    {header}
  </Typography>
);

export default PageHeader;
