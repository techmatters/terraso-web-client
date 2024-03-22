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
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/CancelPresentation';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  Dialog,
  DialogContent,
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
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          <IconButton
            title={t('common.dialog_close_label')}
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
          <Typography variant="h2" sx={{ mb: 2 }}>
            {t('group.membership_card_info_closed_title')}
          </Typography>
          <Stack spacing={1}>
            <Trans i18nKey="group.membership_card_info_close_description">
              <Typography variant="body1">Step 1</Typography>
              <Typography variant="body1">Step 2</Typography>
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
