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

import React, { useCallback, useState } from 'react';
import { MenuItem } from '@mui/material';

import ConfirmationDialog from 'common/components/ConfirmationDialog';

const ConfirmMenuItem = props => {
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const { confirmTitle, confirmMessage, confirmButton, onConfirm, children } =
    props;

  const onClick = useCallback(event => {
    setOpenConfirmation(true);
    event.stopPropagation();
  }, []);

  const onCancel = useCallback(event => {
    setOpenConfirmation(false);
    event.stopPropagation();
  }, []);

  return (
    <>
      <ConfirmationDialog
        open={openConfirmation}
        title={confirmTitle}
        message={confirmMessage}
        confirmButtonLabel={confirmButton}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
      <MenuItem onClick={onClick}>{children}</MenuItem>
    </>
  );
};

export default ConfirmMenuItem;
