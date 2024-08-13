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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  InputLabel,
  Link,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

import MiddleEllipsis from 'common/components/MiddleEllipsis';

const EditableText = props => {
  const { t } = useTranslation();
  const {
    id,
    value,
    label,
    processing,
    addMessage,
    viewProps,
    truncateLongNames,
    onSave,
    isEditing,
    setIsEditing,
  } = props;
  const [isHovering, setIsHovering] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const reset = useCallback(() => {
    setEditedValue(value);
    setIsEditing(false);
    setIsHovering(false);
  }, [value, setIsEditing]);

  const handleSave = useCallback(() => {
    if (editedValue === value) {
      reset();
      return;
    }
    onSave(editedValue);
  }, [value, editedValue, onSave, reset]);

  const handleInputChange = useCallback(
    event => setEditedValue(event.target.value),
    []
  );

  const onInputKeyDown = useCallback(
    event => {
      if (event.keyCode === 13) {
        // Enter key
        handleSave();
      }
    },
    [handleSave]
  );

  const onButtonKeyDown = useCallback(
    event => {
      if (event.keyCode === 13 || event.keyCode === 32) {
        setIsEditing(true);
      }
    },
    [setIsEditing]
  );

  const onButtonClick = useCallback(
    event => {
      setIsEditing(true);
      event.preventDefault();
    },
    [setIsEditing]
  );

  const onButtonMouseOver = useCallback(() => setIsHovering(true), []);
  const onButtononMouseOut = useCallback(() => setIsHovering(false), []);

  const editableInputRef = useRef(null);

  useEffect(() => {
    reset();
  }, [value, reset]);

  useEffect(() => {
    if (isEditing) {
      editableInputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        <InputLabel htmlFor={id} className="visually-hidden">
          {label}
        </InputLabel>
        <OutlinedInput
          id={id}
          size="small"
          value={editedValue}
          inputRef={editableInputRef}
          onChange={handleInputChange}
          onKeyDown={onInputKeyDown}
          sx={{ flexGrow: 1 }}
        />
        <LoadingButton
          variant="contained"
          loading={processing}
          onClick={handleSave}
        >
          {t('common.editable_text_save')}
        </LoadingButton>
        <Button disabled={processing} onClick={reset}>
          {t('common.editable_text_cancel')}
        </Button>
      </Stack>
    );
  }

  const textValue = truncateLongNames ? (
    <MiddleEllipsis>
      <Typography component="span">{value}</Typography>
    </MiddleEllipsis>
  ) : (
    value
  );

  return (
    <Typography
      component={Stack}
      role="button"
      direction="row"
      justifyContent="space-between"
      tabIndex="0"
      onKeyDown={onButtonKeyDown}
      onClick={onButtonClick}
      onMouseOver={onButtonMouseOver}
      onMouseOut={onButtononMouseOut}
      {...viewProps}
      sx={{
        pt: 1,
        pb: 1,
        ...(isHovering
          ? { backgroundColor: 'blue.lite', cursor: 'pointer' }
          : {}),
        ...(viewProps?.sx || {}),
      }}
    >
      {textValue || <Link href="#">+ {addMessage}</Link>}
      {isHovering && (
        <EditIcon
          aria-label={t('common.editable_text_label')}
          sx={{ color: 'blue.dark' }}
        />
      )}
    </Typography>
  );
};

export default EditableText;
