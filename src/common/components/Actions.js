import React from 'react';

import { Button, CardActions, Link } from '@mui/material';

const Actions = ({ label, destination }) => {
  return (
    <CardActions>
      <Button
        component={Link}
        to={destination}
        sx={{ width: '100%', textTransform: 'uppercase' }}
      >
        {label}
      </Button>
    </CardActions>
  );
};

export default Actions;
