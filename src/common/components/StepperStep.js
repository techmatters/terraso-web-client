import React from 'react';

import { Button, Stack } from '@mui/material';

import PageHeader from 'layout/PageHeader';

const StepperStep = props => {
  const {
    title,
    children,
    nextLabel,
    onNext,
    nextDisabled,
    backLabel,
    onBack,
  } = props;
  return (
    <>
      <PageHeader header={title} />
      {children}
      <Stack direction="row" justifyContent="space-between">
        {backLabel && (
          <Button sx={{ marginTop: 2 }} onClick={onBack}>
            {backLabel}
          </Button>
        )}
        {nextLabel && (
          <Button
            variant="contained"
            sx={{ marginTop: 2 }}
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </Button>
        )}
      </Stack>
    </>
  );
};

export default StepperStep;
