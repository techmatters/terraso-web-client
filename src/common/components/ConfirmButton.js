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
