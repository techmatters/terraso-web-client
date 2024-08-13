/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { useState } from 'react';
import _ from 'lodash/fp';
import { Stepper as BaseStepper, Step } from '@mui/material';

const Stepper = props => {
  const { steps, listProps } = props;
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = _.defaults({ showStepper: true }, steps[activeStepIndex]);

  return (
    <>
      {activeStep.showStepper && (
        <BaseStepper
          activeStep={activeStepIndex}
          connector={null}
          sx={{ marginBottom: 6, paddingLeft: 0, listStylePosition: 'inside' }}
          component="ol"
          {...listProps}
        >
          {steps.map((step, index) => (
            <Step
              component="li"
              aria-label={step.label}
              key={index}
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
      )}
      {activeStep.render({ setActiveStepIndex })}
    </>
  );
};

export default Stepper;
