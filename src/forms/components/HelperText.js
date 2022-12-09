import React, { useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { IconButton, Popover, Stack, Typography } from '@mui/material';

const HelperText = props => {
  const { t } = useTranslation();
  const { label, Component, i18nKey, titleKey } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const content = i18nKey ? (
    <Typography sx={{ p: 2 }}>
      <Trans i18nKey={i18nKey} />
    </Typography>
  ) : (
    <Component />
  );

  return (
    <>
      <IconButton
        aria-label={t('form.helper_text_info_label', { label })}
        onClick={handleClick}
      >
        <InfoIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {titleKey && (
          <Stack direction="row">
            <Typography
              variant="h6"
              component="h1"
              sx={{ pl: 2, pr: 2, pt: 2 }}
            >
              {t(titleKey)}
            </Typography>
            <IconButton
              aria-label={t('form.helper_text_info_close')}
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: theme => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        )}
        {content}
      </Popover>
    </>
  );
};

export default HelperText;
