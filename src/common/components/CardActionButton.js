import React from 'react';

import { Link } from 'react-router-dom';

import { Button, CardActions } from '@mui/material';

const CardActionButton = ({ label, to }) => {
  return (
    <CardActions>
      <Button
        component={Link}
        to={to}
        sx={{
          width: '100%',
          textTransform: 'uppercase',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'underline',
          },
        }}
      >
        {label}
      </Button>
    </CardActions>
  );
};

export default CardActionButton;
