import React from 'react';

import { Alert, Stack } from '@mui/material';

const SuccessContainer = props => {
  const { message, label, children } = props;

  return (
    <Stack
      component="section"
      aria-label={label}
      justifyContent="center"
      spacing={1}
      sx={{ bgcolor: 'success.background', flexGrow: 1, p: 2 }}
    >
      <Alert
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          p: 0,
        }}
        severity="success"
      >
        {message}
      </Alert>
      {children}
    </Stack>
  );
};

export default SuccessContainer;
