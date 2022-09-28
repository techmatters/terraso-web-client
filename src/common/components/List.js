import React from 'react';

import { List as BaseList, Divider, Paper, Stack } from '@mui/material';

import { withProps } from 'react-hoc';

const List = withProps(BaseList, {
  component: withProps(Stack, {
    divider: <Divider aria-hidden="true" component="li" />,
    component: withProps(Paper, {
      variant: 'outlined',
      component: 'ul',
    }),
  }),
});

export default List;
