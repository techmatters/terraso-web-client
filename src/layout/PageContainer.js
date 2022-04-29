import React from 'react';

import { Container } from '@mui/material';

import _ from 'lodash/fp';

const PageContainer = props => {
  return (
    <Container
      aria-live="polite"
      sx={theme => ({
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
        ...props.sx,
      })}
      {..._.omit('sx', props)}
    />
  );
};

export default PageContainer;
