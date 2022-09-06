import React from 'react';

import _ from 'lodash/fp';

import { Container } from '@mui/material';

const PageContainer = props => {
  return (
    <Container
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
