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

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Alert,
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

import { useCopy } from 'custom-hooks';

import { useShareEvent } from 'monitoring/events';

import CopyLink from './CopyLink';

import theme from 'theme';

const SocialShareContext = createContext({});

export const useSocialShareContext = props => {
  const { setSocialShareProps } = useContext(SocialShareContext);

  useEffect(() => {
    setSocialShareProps(props);
    return () => setSocialShareProps({});
  }, [props, setSocialShareProps]);
};

export const SocialShareContextProvider = props => {
  const { children } = props;
  const [socialShareProps, setSocialShareProps] = useState({});

  return (
    <SocialShareContext.Provider
      value={{ setSocialShareProps, socialShareProps }}
    >
      {children}
    </SocialShareContext.Provider>
  );
};

const CopyEmbededCode = props => {
  const { onShare } = props;
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const {
    socialShareProps: { embedUrl, itemType },
  } = useContext(SocialShareContext);

  const embedCode = useMemo(() => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('title', t('share.embed_title'));
    iframe.setAttribute('width', '750');
    iframe.setAttribute('height', '500');

    return iframe.outerHTML;
  }, [embedUrl, t]);

  const { copied, copyToClipboard } = useCopy(embedCode, () => {
    onShare('embed');
  });

  if (!embedUrl) {
    return null;
  }

  return (
    <>
      <InputLabel
        htmlFor="share-embed-code"
        sx={{
          marginTop: 4,
          color: 'black',
          fontSize: '1.3rem',
        }}
      >
        {t('share.copy_embed_code', { item: t(itemType) })}
      </InputLabel>
      <TextField
        size="small"
        variant="outlined"
        value={embedCode}
        fullWidth
        multiline
        rows={3}
        InputProps={{
          id: 'share-embed-code',
          sx: {
            fontFamily: 'monospace',
            flexDirection: { xs: 'column', sm: 'row' },
            paddingRight: 0,
          },
          readOnly: true,
        }}
      />
      <Button
        variant="outlined"
        onClick={copyToClipboard}
        sx={{
          width: isSmall ? '100%' : 'auto',
          mt: isSmall ? 0 : 1,
        }}
      >
        {t('share.copy_embed_button')}
      </Button>
      {copied && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {t('share.copy_embed_button_done')}
        </Alert>
      )}
    </>
  );
};

const PostToService = props => {
  const { name, pageUrl, onShare } = props;
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const shareText = useMemo(
    () => encodeURIComponent(t('share.invite_text', { name, url: pageUrl })),
    [name, pageUrl, t]
  );

  const shareViaEmail = () => {
    const subject = encodeURIComponent(t('share.invite_subject', { name }));
    window.open(`mailto:?subject=${subject}&body=${shareText}`);
    onShare('email');
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareText}`);
    onShare('whatsapp');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(pageUrl);
    window.open(`http://www.facebook.com/share.php?u=${url}`);
    onShare('facebook');
  };

  return (
    <>
      <Typography sx={{ marginBottom: 1 }}>{t('share.services')}</Typography>
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
            startIcon={
              <EmailIcon sx={{ paddingRight: 1, color: 'secondary.main' }} />
            }
            onClick={shareViaEmail}
            sx={{
              '&:hover svg': {
                color: 'white',
              },
              width: {
                xs: '100%',
                sm: 'auto',
              },
            }}
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
                  color: 'secondary.main',
                }}
              />
            }
            onClick={shareViaWhatsApp}
            sx={{
              '&:hover svg': {
                color: 'white',
              },
              width: {
                xs: '100%',
                sm: 'auto',
              },
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
            startIcon={
              <FacebookIcon sx={{ paddingRight: 1, color: 'secondary.main' }} />
            }
            onClick={shareViaFacebook}
            sx={{
              '&:hover svg': {
                color: 'white',
              },
              width: {
                xs: '100%',
                sm: 'auto',
              },
            }}
          >
            {t('share.facebook')}
          </Button>
        </li>
      </Stack>
    </>
  );
};

const SocialShare = props => {
  const { buttonProps } = props;
  const { t } = useTranslation();
  const { onShare } = useShareEvent();
  const { socialShareProps } = useContext(SocialShareContext);
  const { name } = socialShareProps;
  const [open, setOpen] = useState(false);

  const pageUrl = useMemo(() => window.location, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
  };

  // focus on the close button on open
  const onCloseRefChange = ref => {
    if (ref) {
      ref.focus();
    }
  };

  if (!name) {
    return null;
  }

  return (
    <>
      <Button variant="outlined" onClick={handleOpen} {...buttonProps}>
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
            title={t('common.dialog_close_label')}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ paddingBottom: 5 }}>
          <PostToService name={name} pageUrl={pageUrl} onShare={onShare} />
          <CopyLink pageUrl={pageUrl} onShare={onShare} />
          <CopyEmbededCode onShare={onShare} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocialShare;
