import React from 'react';

import { SvgIcon } from '@mui/material';

const LinkIcon = props => (
  <SvgIcon {...props}>
    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.544 8.456a4.368 4.368 0 00-6.176 0L2.28 11.543a4.368 4.368 0 006.177 6.177L10 16.176"
        stroke="gray"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.457 11.544a4.368 4.368 0 006.175 0l3.09-3.088a4.367 4.367 0 00-6.178-6.177l-1.543 1.544"
        stroke="gray"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </SvgIcon>
);

export default LinkIcon;
