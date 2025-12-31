/*
 * Copyright © 2024 Technology Matters
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

import { useTranslation } from 'react-i18next';
import { Alert, Button, InputLabel, TextField } from '@mui/material';

import { useCopy } from 'terraso-web-client/custom-hooks';

const CopyLink = props => {
  const { pageUrl, onShare } = props;
  const { t } = useTranslation();

  const { copied, copyToClipboard } = useCopy(pageUrl, () => {
    onShare?.('link');
  });

  return (
    <>
      <InputLabel
        htmlFor="share-link"
        sx={{
          marginTop: 4,
          color: 'black',
          fontSize: '1.3rem',
        }}
      >
        {t('share.copy')}
      </InputLabel>
      <TextField
        size="small"
        variant="outlined"
        value={pageUrl}
        fullWidth
        sx={{
          '& .MuiInputBase-input': {
            flexGrow: 1,
            width: 'auto',
          },
        }}
        slotProps={{
          input: {
            id: 'share-link',
            sx: {
              flexDirection: { xs: 'column', sm: 'row' },
              paddingRight: 0,
            },
            readOnly: true,
            endAdornment: (
              <Button
                variant="contained"
                onClick={copyToClipboard}
                sx={{
                  marginLeft: { xs: 0, sm: 2 },
                  minWidth: '100px',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {t('share.copy_button')}
              </Button>
            ),
          },
        }}
      />
      {copied && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {t('share.copy_button_done')}
        </Alert>
      )}
    </>
  );
};

export default CopyLink;
