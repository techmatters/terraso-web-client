import React, { useEffect, useState } from 'react';

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
  const { id, value, label, processing, addMessage, viewProps, onSave } = props;
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleSave = () => {
    onSave(editedValue);
  };

  const onKeyDown = event => {
    if (event.keyCode === 13) {
      // Enter key
      onSave(editedValue);
    }
  };

  useEffect(() => {
    setEditedValue(value);
    setIsEditing(false);
  }, [value]);

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
          onChange={event => setEditedValue(event.target.value)}
          onKeyDown={onKeyDown}
          sx={{ flexGrow: 1 }}
        />
        <LoadingButton
          variant="contained"
          loading={processing}
          onClick={handleSave}
        >
          {t('common.editable_text_save')}
        </LoadingButton>
        <Button disabled={processing} onClick={() => setIsEditing(false)}>
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
      onClick={() => setIsEditing(true)}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      {...viewProps}
      sx={{
        padding: 1,
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
