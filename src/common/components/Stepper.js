import { useState } from 'react';

import { Stepper as BaseStepper, Step } from '@mui/material';

const Stepper = props => {
  const { steps } = props;
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = steps[activeStepIndex];

  return (
    <>
      <BaseStepper
        activeStep={activeStepIndex}
        connector={null}
        sx={{ marginBottom: 2, paddingLeft: 0, listStylePosition: 'inside' }}
        component="ol"
      >
        {steps.map((step, index) => (
          <Step
            component="li"
            sx={{
              borderBottom: '8px solid',
              borderColor:
                index <= activeStepIndex ? 'primary.main' : 'gray.lite1',
              fontWeight: index <= activeStepIndex ? '500' : '300',
              marginRight: '2px',
              flexGrow: 1,
              paddingBottom: 1,
              paddingLeft: 0,
              overflowWrap: 'break-word',
              textTransform: 'uppercase',
            }}
          >
            {step.label}
          </Step>
        ))}
      </BaseStepper>
      {activeStep.render({ setActiveStepIndex })}
    </>
  );
};

export default Stepper;
