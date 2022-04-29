import React from 'react';

import { Card } from '@mui/material';

import _ from 'lodash/fp';

const HomeCard = props => (
  <Card
    component="section"
    {...props}
    sx={{
      display: 'flex',
      ..._.getOr({}, 'sx', props),
    }}
  >
    {props.children}
  </Card>
);

export default HomeCard;
