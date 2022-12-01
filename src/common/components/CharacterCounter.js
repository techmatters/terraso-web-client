import React from 'react';

import { Typography } from '@mui/material';

const CharacterCounter = props => {
  const { text, max } = props;
  const currentLen = text.length;
  return (
    <Typography variant="caption" sx={{ float: 'right' }}>
      {currentLen} / {max}
    </Typography>
  );
};

export default CharacterCounter;
