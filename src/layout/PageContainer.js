import React from 'react';
import { Box } from '@mui/material';

const PageContainer = ({ children }) => {
  return (
    <Box
      aria-live="polite"
      sx={theme => ({
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      })}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
