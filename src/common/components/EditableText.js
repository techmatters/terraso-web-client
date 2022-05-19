import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import EditIcon from '@mui/icons-material/Edit';
import { Button, Link, OutlinedInput, Stack, Typography } from '@mui/material';

const EditableText = props => {
  const { t } = useTranslation();
  const { value, addMessage, viewProps, onSave } = props;
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleSave = () => {
    onSave(editedValue);
  };

  useEffect(() => {
    setEditedValue(value);
    setIsEditing(false);
  }, [value]);

  if (isEditing) {
    return (
      <Stack direction="row" spacing={1}>
        <OutlinedInput
          size="small"
          value={editedValue}
          onChange={event => setEditedValue(event.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button variant="contained" onClick={handleSave}>
          {t('common.editable_text_save')}
        </Button>
        <Button onClick={() => setIsEditing(false)}>
          {t('common.editable_text_cancel')}
        </Button>
      </Stack>
    );
  }

  return (
    <Typography
      component={Stack}
      direction="row"
      justifyContent="space-between"
      onClick={() => setIsEditing(true)}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      sx={{
        padding: 1,
        ...(isHovering
          ? { backgroundColor: 'blue.lite', cursor: 'pointer' }
          : {}),
      }}
      {...viewProps}
    >
      {value && value !== '' ? value : <Link>+ {addMessage}</Link>}
      {isHovering && <EditIcon sx={{ color: 'blue.dark' }} />}
    </Typography>
  );
};

export default EditableText;
