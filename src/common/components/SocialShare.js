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
import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import theme from 'theme';

const SocialShare = ({ name }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [buttonCopied, setButtonCopied] = useState(false);
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setButtonCopied(false);
  };

  const pageUrl = window.location;

  const shareText = useMemo(
    () => encodeURIComponent(t('share.invite_text', { name, url: pageUrl })),
    [name, pageUrl, t]
  );

  const shareViaEmail = () => {
    const subject = encodeURIComponent(t('share.invite_subject', { name }));
    window.open(`mailto:?subject=${subject}&body=${shareText}`);
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareText}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(pageUrl);
    window.open(`http://www.facebook.com/share.php?u=${url}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pageUrl);
    setButtonCopied(true);
  };

  // focus on the close button on open
  const onCloseRefChange = ref => {
    if (ref) {
      ref.focus();
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        {t('share.button')}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          component={Stack}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography component="h1" variant="h2" sx={{ padding: 0 }}>
            {t('share.title', { name: name })}
          </Typography>
          <IconButton
            ref={onCloseRefChange}
            onClick={handleClose}
            sx={{ marginLeft: 3 }}
            aria-label={t('share.close')}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ paddingBottom: 5 }}>
          <Typography sx={{ marginBottom: 1 }}>
            {t('share.services')}
          </Typography>
          <Stack
            component="ul"
            role="list"
            direction={isSmall ? 'column' : 'row'}
            justifyContent="space-between"
            sx={{
              listStyle: 'none',
              padding: 0,
            }}
          >
            <li>
              <Button
                variant="outlined"
                startIcon={<EmailIcon sx={{ paddingRight: 1 }} />}
                onClick={shareViaEmail}
              >
                {t('share.email')}
              </Button>
            </li>
            <li>
              <Button
                variant="outlined"
                startIcon={
                  <WhatsAppIcon
                    sx={{
                      paddingRight: 1,
                    }}
                  />
                }
                onClick={shareViaWhatsApp}
                sx={{
                  marginTop: {
                    xs: 2,
                    sm: 'auto',
                  },
                  marginBottom: {
                    xs: 2,
                    sm: 'auto',
                  },
                }}
              >
                {t('share.whatsapp')}
              </Button>
            </li>
            <li>
              <Button
                variant="outlined"
                startIcon={<FacebookIcon sx={{ paddingRight: 1 }} />}
                onClick={shareViaFacebook}
              >
                {t('share.facebook')}
              </Button>
            </li>
          </Stack>
          <InputLabel
            htmlFor="share-link"
            sx={{
              marginTop: 4,
              color: theme.palette.black,
              fontSize: '1.3rem',
            }}
          >
            {t('share.copy')}
          </InputLabel>
          <Stack direction={isSmall ? 'column' : 'row'} sx={{ width: '100%' }}>
            <TextField
              size="small"
              variant="outlined"
              value={pageUrl}
              fullWidth
              InputProps={{
                id: 'share-link',
                sx: {
                  paddingRight: 0,
                },
                readOnly: true,
                endAdornment: (
                  <Button
                    variant="outlined"
                    onClick={copyToClipboard}
                    sx={{ marginLeft: 2, minWidth: '100px' }}
                  >
                    {buttonCopied
                      ? t('share.copy_button_done')
                      : t('share.copy_button')}
                  </Button>
                ),
              }}
            />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocialShare;
