import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'

import theme from 'theme'
import { LoadingButton } from '@mui/lab'

const ConfirmationDialog = props => {
  const { t } = useTranslation()
  const { title, message, confirmButtonLabel, onConfirm, onCancel, open, loading } = props
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <LoadingButton
          variant="contained"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmButtonLabel}
        </LoadingButton>
        <Button onClick={onCancel}>
          {t('common.dialog_cancel_label')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationDialog
