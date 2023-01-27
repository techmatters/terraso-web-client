﻿/*
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
import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';

import ConfirmationDialog from 'common/components/ConfirmationDialog';

const ConfirmButton = props => {
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const {
    confirmTitle,
    confirmMessage,
    confirmButton,
    buttonLabel,
    ariaLabel,
    loading,
    buttonProps,
    onConfirm,
    variant,
    tooltip,
  } = props;

  useEffect(() => {
    setOpenConfirmation(false);
  }, []);

  const onClick = event => {
    setOpenConfirmation(true);
    event.stopPropagation();
  };

  const TooltipWrapper = tooltip
    ? ({ children }) => <Tooltip title={tooltip}>{children}</Tooltip>
    : React.Fragment;
  return (
    <>
      <ConfirmationDialog
        open={openConfirmation}
        title={confirmTitle}
        message={confirmMessage}
        confirmButtonLabel={confirmButton}
        onCancel={() => setOpenConfirmation(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <TooltipWrapper>
        <LoadingButton
          onClick={onClick}
          loading={loading}
          variant={variant || 'outlined'}
          aria-label={ariaLabel}
          {...(buttonProps || {})}
        >
          {buttonLabel || props.children}
        </LoadingButton>
      </TooltipWrapper>
    </>
  );
};

export default ConfirmButton;
