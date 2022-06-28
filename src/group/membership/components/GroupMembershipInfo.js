import React, { useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/CancelPresentation';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

const GroupMembershipInfo = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setOpen(true)} aria-label="delete">
        <InfoIcon />
      </IconButton>
      <Dialog open={open}>
        <DialogTitle component="h1" sx={{ pr: 7 }}>
          {t('group.membership_card_info_title')}
          <IconButton
            aria-label={t('group.membership_card_info_close')}
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h2" sx={{ mb: 2 }}>
            {t('group.membership_card_info_closed_title')}
          </Typography>
          <Stack spacing={1}>
            <Trans i18nKey="group.membership_card_info_close_description">
              <Typography variant="body1">Step 1</Typography>
              <Typography variant="body1">Step 2</Typography>
              <Typography variant="body1">Step 3</Typography>
            </Trans>
          </Stack>
          <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
            {t('group.membership_card_info_open_title')}
          </Typography>
          <Typography variant="body1">
            {t('group.membership_card_info_open_description')}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupMembershipInfo;
