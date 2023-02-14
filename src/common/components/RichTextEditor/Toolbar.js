import React from 'react';

import { ButtonGroup, Divider, Stack } from '@mui/material';

const Toolbar = props => {
  const { groups } = props;

  return (
    <Stack
      divider={
        <Divider
          flexItem
          orientation="vertical"
          variant="middle"
          aria-hidden="true"
        />
      }
      direction="row"
      sx={{
        bgcolor: 'gray.lite2',
      }}
    >
      {groups.map((group, index) => (
        <ButtonGroup
          key={index}
          size="small"
          disableElevation
          variant="text"
          sx={{
            '& .MuiButton-root': {
              color: 'black',
            },
            '& .MuiButton-root.Mui-disabled': {
              color: 'gray.mid',
            },
            '& .MuiButtonGroup-grouped:not(:last-of-type)': {
              borderRight: 'none',
            },
          }}
        >
          {group}
        </ButtonGroup>
      ))}
    </Stack>
  );
};

export default Toolbar;
