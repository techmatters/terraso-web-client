import React, { useMemo, useRef, useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Popover,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

const CloseIconButton = props => {
  const { t } = useTranslation();
  const { onClick } = props;

  return (
    <IconButton
      size="small"
      aria-label={t('form.helper_text_info_close')}
      onClick={onClick}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme => theme.palette.grey[500],
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};

const HelperText = props => {
  const { t } = useTranslation();
  const {
    label,
    Component,
    i18nKey,
    titleKey,
    useAnchor = true,
    maxWidth = '40rem',
  } = props;
  const anchorEl = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const content = i18nKey ? (
    <Typography sx={{ p: 2, pr: 4, maxWidth: '30rem' }}>
      <Trans i18nKey={i18nKey} />
    </Typography>
  ) : (
    <Component />
  );

  const Container = useMemo(() => {
    return useAnchor
      ? withProps(Popover, {
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'center',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          PaperProps: {
            sx: {
              maxWidth,
            },
          },
        })
      : withProps(Dialog, {
          fullWidth: true,
          maxWidth: false,
          PaperProps: {
            sx: {
              maxWidth,
            },
          },
          BackdropProps: {
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          },
        });
  }, [useAnchor, maxWidth]);

  const TitleContainer = useMemo(
    () =>
      useAnchor
        ? withProps(Typography, {
            variant: 'h6',
            component: 'h1',
            sx: { pl: 2, pr: 2, pt: 2 },
          })
        : withProps(DialogTitle, { component: 'h1' }),
    [useAnchor]
  );

  const ContentContainer = useMemo(
    () => (useAnchor ? React.Fragment : DialogContent),
    [useAnchor]
  );

  return (
    <>
      <IconButton
        ref={anchorEl}
        aria-label={t('form.helper_text_info_label', { label })}
        onClick={handleClick}
      >
        <InfoIcon />
      </IconButton>
      <Container
        open={open}
        onClose={handleClose}
        {...(useAnchor ? { anchorEl: anchorEl.current } : {})}
      >
        <>
          <CloseIconButton onClick={handleClose} />
          {titleKey && <TitleContainer>{t(titleKey)}</TitleContainer>}
          <ContentContainer>{content}</ContentContainer>
        </>
      </Container>
    </>
  );
};

export default HelperText;
