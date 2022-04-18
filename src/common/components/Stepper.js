import React from 'react';
import { Step, StepLabel, Stepper as BaseStepper } from '@mui/material';

const Stepper = props => {
  const { steps } = props;
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);

  const activeStep = steps[activeStepIndex];

  return (
    <>
      <BaseStepper activeStep={activeStepIndex}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </BaseStepper>
      {activeStep.render({ setActiveStepIndex })}
    </>
  );
};

export default Stepper;
