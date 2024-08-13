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

import React from 'react';
import { Alert, Stack } from '@mui/material';

const SuccessContainer = props => {
  const { message, label, children } = props;

  return (
    <Stack
      component="section"
      aria-label={label}
      justifyContent="center"
      spacing={1}
      sx={{ bgcolor: 'success.background', flexGrow: 1, p: 2 }}
    >
      <Alert
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          p: 0,
        }}
        severity="success"
      >
        {message}
      </Alert>
      {children}
    </Stack>
  );
};

export default SuccessContainer;
