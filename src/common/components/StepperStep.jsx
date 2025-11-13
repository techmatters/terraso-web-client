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

import { Button, Stack } from '@mui/material';

import PageHeader from 'terraso-web-client/layout/PageHeader';

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
