import React, { useCallback, useEffect, useRef, useState } from 'react';

import { OutlinedInput } from '@mui/material';

const EditableText = props => {
  const { Component, value, onChange, placeholder, inputProps = {} } = props;
  const [isEditing, setIsEditing] = useState(!value);
  const inputRef = useRef(null);

  const onExit = useCallback(() => {
    if (!value) {
      return;
    }
    setIsEditing(false);
  }, [value]);
  const onClick = useCallback(() => setIsEditing(true), []);
  const onChangeWrapper = useCallback(
    event => onChange(event.target.value),
    [onChange]
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <OutlinedInput
        inputRef={inputRef}
        fullWidth
        value={value}
        onBlur={onExit}
        onChange={onChangeWrapper}
        placeholder={placeholder}
        {...inputProps}
        sx={{
          '& .MuiInputBase-input': { bgcolor: 'transparent', color: 'white' },
        }}
      />
    );
  }

  return <Component onClick={onClick}>{value}</Component>;
};

export default EditableText;
