import React from 'react';
import { Step, Stepper as BaseStepper, Typography } from '@mui/material';

const Stepper = props => {
  const { steps } = props;
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);

  const activeStep = steps[activeStepIndex];

  return (
    <>
      <BaseStepper
        activeStep={activeStepIndex}
        connector={null}
        sx={{ marginBottom: 2 }}
      >
        {steps.map((step, index) => (
          <Typography
            variant="body2"
            component={Step}
            key={index}
            sx={{
              borderBottom: '8px solid',
              borderColor: index <= activeStepIndex ? 'gray.mid' : 'gray.lite1',
              fontWeight: index <= activeStepIndex ? '500' : '300',
              marginRight: '2px',
              flexGrow: 1,
              paddingBottom: 1,
              overflowWrap: 'break-word',
              textTransform: 'uppercase',
            }}
          >
            {index + 1}. {step.label}
          </Typography>
        ))}
      </BaseStepper>
      {activeStep.render({ setActiveStepIndex })}
    </>
  );
};

export default Stepper;
