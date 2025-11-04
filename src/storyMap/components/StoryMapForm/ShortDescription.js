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

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Stack, Typography } from '@mui/material';

import ShortDescriptionDialog from './ShortDescriptionDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';

const ShortDescription = () => {
  const { t } = useTranslation();
  const { config, setConfig } = useStoryMapConfigContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSaveDescription = useCallback(
    description => {
      setConfig(config => ({
        ...config,
        description,
      }));
      handleCloseDialog();
    },
    [setConfig, handleCloseDialog]
  );

  return (
    <>
      <Stack sx={{ m: 1, mb: 2 }} spacing={1}>
        {config.description && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {config.description}
          </Typography>
        )}
        <Link
          component="button"
          variant="text"
          onClick={handleOpenDialog}
          sx={{ textAlign: 'left' }}
        >
          {config.description
            ? t('storyMap.form_short_description_edit_link')
            : t('storyMap.form_short_description_button')}
        </Link>
      </Stack>

      <ShortDescriptionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveDescription}
        existingDescription={config.description}
      />
    </>
  );
};

export default ShortDescription;
