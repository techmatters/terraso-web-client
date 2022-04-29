import React from 'react';

import _ from 'lodash/fp';

import { Card } from '@mui/material';

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
