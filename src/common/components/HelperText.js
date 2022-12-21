import React, { useMemo, useRef, useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Dialog, IconButton, Popover, Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

const HelperText = props => {
  const { t } = useTranslation();
  const { label, Component, i18nKey, titleKey, useAnchor = true } = props;
  const anchorEl = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const content = i18nKey ? (
    <Typography sx={{ p: 2, maxWidth: '30rem' }}>
      <Trans i18nKey={i18nKey} />
    </Typography>
  ) : (
    <Component />
  );

  const CloseIconButton = () => {
    const { t } = useTranslation();

    return (
      <IconButton
        size="small"
        aria-label={t('form.helper_text_info_close')}
        onClick={handleClose}
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

  const Container = useMemo(() => {
    const paperProps = {
      sx: { pr: 4 },
    };
    return useAnchor
      ? withProps(Popover, {
          PaperProps: paperProps,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'center',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        })
      : withProps(Dialog, {
          fullWidth: true,
          maxWidth: false,
          PaperProps: paperProps,
          BackdropProps: {
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          },
        });
  }, [useAnchor]);

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
          {titleKey && (
            <Stack direction="row">
              <Typography
                variant="h6"
                component="h1"
                sx={{ pl: 2, pr: 2, pt: 2 }}
              >
                {t(titleKey)}
              </Typography>
            </Stack>
          )}
          <CloseIconButton />
          {content}
        </>
      </Container>
    </>
  );
};

export default HelperText;
