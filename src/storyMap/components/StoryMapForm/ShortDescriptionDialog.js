/*
 * Copyright © 2025 Technology Matters
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

import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

// Style constants
const DIALOG_ACTIONS_SX = {
  padding: '20px',
  justifyContent: 'space-between',
};

const MAX_DESCRIPTION_LENGTH = 500;

const ShortDescriptionDialog = props => {
  const { t } = useTranslation();
  const { open, onClose, onSave, existingDescription } = props;

  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setDescription(existingDescription || '');
      setError(null);
    }
  }, [open, existingDescription]);

  const handleDescriptionChange = useCallback(
    event => {
      const newValue = event.target.value;
      setDescription(newValue);

      if (newValue.length > MAX_DESCRIPTION_LENGTH) {
        setError(
          t('storyMap.form_short_description_error_too_long', {
            maxLength: MAX_DESCRIPTION_LENGTH,
          })
        );
      } else {
        setError(null);
      }
    },
    [t]
  );

  const handleSave = useCallback(() => {
    if (error) {
      return;
    }
    onSave(description.trim() || null);
  }, [description, error, onSave]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          'aria-label': t('storyMap.form_short_description_dialog_title'),
        },
      }}
    >
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            <Trans i18nKey="storyMap.form_short_description_dialog_help" />
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            placeholder={t('storyMap.form_short_description_placeholder')}
            error={!!error}
            helperText={error}
            slotProps={{
              input: {
                'aria-label': t('storyMap.form_short_description_input_label'),
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={DIALOG_ACTIONS_SX}>
        <Button onClick={onClose}>{t('common.dialog_cancel_label')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!!error}
          color="primary"
        >
          {t('storyMap.form_featured_image_save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShortDescriptionDialog;
