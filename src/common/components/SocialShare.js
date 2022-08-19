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
          <Typography variant="h2" sx={{ padding: 0 }}>
            {t('share.title', { name: name })}
          </Typography>
          <IconButton
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
            direction={isSmall ? 'column' : 'row'}
            justifyContent="space-between"
          >
            <Button
              variant="outlined"
              startIcon={<EmailIcon sx={{ paddingRight: 1 }} />}
              onClick={shareViaEmail}
            >
              {t('share.email')}
            </Button>
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
            <Button
              variant="outlined"
              startIcon={<FacebookIcon sx={{ paddingRight: 1 }} />}
              onClick={shareViaFacebook}
            >
              {t('share.facebook')}
            </Button>
          </Stack>
          <Typography sx={{ marginTop: 4 }}>{t('share.copy')}</Typography>
          <Stack direction={isSmall ? 'column' : 'row'} sx={{ width: '100%' }}>
            <TextField
              size="small"
              variant="outlined"
              value={pageUrl}
              fullWidth
              InputProps={{
                sx: {
                  paddingRight: 0,
                },
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
