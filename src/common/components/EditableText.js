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

const EditableText = props => {
  const { t } = useTranslation();
  const {
    id,
    value,
    label,
    processing,
    addMessage,
    viewProps,
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

  const handleSave = () => {
    if (editedValue === value) {
      reset();
      return;
    }
    onSave(editedValue);
  };

  const onSaveClick = () => {
    handleSave();
  };

  const onKeyDown = event => {
    if (event.keyCode === 13) {
      // Enter key
      handleSave();
    }
  };

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
      <Stack direction="row" spacing={1}>
        <InputLabel htmlFor={id} className="visually-hidden">
          {label}
        </InputLabel>
        <OutlinedInput
          id={id}
          size="small"
          value={editedValue}
          inputRef={editableInputRef}
          onChange={event => setEditedValue(event.target.value)}
          onKeyDown={onKeyDown}
          sx={{ flexGrow: 1 }}
        />
        <LoadingButton
          variant="contained"
          loading={processing}
          onClick={onSaveClick}
        >
          {t('common.editable_text_save')}
        </LoadingButton>
        <Button disabled={processing} onClick={reset}>
          {t('common.editable_text_cancel')}
        </Button>
      </Stack>
    );
  }

  return (
    <Typography
      component={Stack}
      role="button"
      direction="row"
      justifyContent="space-between"
      tabIndex="0"
      onKeyDown={event => {
        if (event.keyCode === 13 || event.keyCode === 32) {
          setIsEditing(true);
        }
      }}
      onClick={event => {
        setIsEditing(true);
        event.preventDefault();
      }}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
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
      {value || <Link href="#">+ {addMessage}</Link>}
      {isHovering && <EditIcon sx={{ color: 'blue.dark' }} />}
    </Typography>
  );
};

export default EditableText;
