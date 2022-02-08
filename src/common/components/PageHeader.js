import React from 'react';
import { Typography } from '@mui/material';

const PageHeader = ({ header }) => (
  <Typography variant="h1" sx={theme => ({ marginBottom: theme.spacing(3) })}>
    {header}
  </Typography>
);

export default PageHeader;
