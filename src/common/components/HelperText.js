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
import React, { useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  Button,
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
      title={t('common.dialog_close_label')}
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
    showLabel = false,
    Component,
    i18nKey,
    titleKey,
    useAnchor = true,
    maxWidth = '40rem',
    buttonProps = {},
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
      {showLabel ? (
        <Button
          title={t('form.helper_text_info_label', { label })}
          endIcon={<InfoIcon ref={anchorEl} fontSize="1rem" />}
          onClick={handleClick}
          {...buttonProps}
        >
          {label}
        </Button>
      ) : (
        <IconButton
          size="small"
          ref={anchorEl}
          title={
            label
              ? t('form.helper_text_info_label', { label: label })
              : t('form.helper_text_info')
          }
          onClick={handleClick}
          {...buttonProps}
        >
          <InfoIcon fontSize="1rem" />
        </IconButton>
      )}
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
