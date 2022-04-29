import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';

import ConfirmationDialog from 'common/components/ConfirmationDialog';

const ConfirmButton = props => {
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const {
    confirmTitle,
    confirmMessage,
    confirmButton,
    buttonLabel,
    loading,
    buttonProps,
    onConfirm,
  } = props;

  useEffect(() => {
    setOpenConfirmation(false);
  }, []);

  const onClick = event => {
    setOpenConfirmation(true);
    event.stopPropagation();
  };

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
      <LoadingButton
        onClick={onClick}
        loading={loading}
        variant="outlined"
        {...(buttonProps || {})}
      >
        {buttonLabel}
      </LoadingButton>
    </>
  );
};

export default ConfirmButton;
