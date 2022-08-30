import React from 'react';

import { useTranslation } from 'react-i18next';

import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import theme from 'theme';

const ConfirmationDialog = props => {
  const { t } = useTranslation();
  const {
    title,
    message,
    confirmButtonLabel,
    onConfirm,
    onCancel,
    open,
    loading,
  } = props;
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // focus on the cancel button on open
  const onCancelRefChange = ref => {
    if (ref) {
      ref.focus();
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle component="h1" id="confirmation-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'flex-end',
          padding: '20px',
        }}
      >
        <Button ref={onCancelRefChange} onClick={onCancel}>
          {t('common.dialog_cancel_label')}
        </Button>

        <LoadingButton
          variant="contained"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmButtonLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
