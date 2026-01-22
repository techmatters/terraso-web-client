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

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Stack, Typography } from '@mui/material';

import ShortDescriptionDialog from 'terraso-web-client/storyMap/components/StoryMapForm/ShortDescriptionDialog';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

const DESCRIPTION_STYLES = {
  whiteSpace: 'pre-wrap',
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

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
      <Stack spacing={1}>
        {config.description && (
          <Typography variant="body2" sx={DESCRIPTION_STYLES}>
            {config.description}
          </Typography>
        )}
        <Button
          variant="text"
          size="small"
          onClick={handleOpenDialog}
          sx={{
            justifyContent: 'flex-start',
            px: 0,
          }}
        >
          {config.description
            ? t('storyMap.form_short_description_edit_link')
            : t('storyMap.form_short_description_button')}
        </Button>
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
