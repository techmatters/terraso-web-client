import React, { useCallback, useEffect, useRef, useState } from 'react';

import { OutlinedInput } from '@mui/material';

const EditableText = props => {
  const {
    Component,
    value,
    onChange,
    placeholder,
    inputProps = {},
    focus,
  } = props;
  const [isEditing, setIsEditing] = useState(!value);
  const [shouldFocus, setShouldFocus] = useState(focus);
  const inputRef = useRef(null);

  const onExit = useCallback(() => {
    if (!value) {
      return;
    }
    setIsEditing(false);
  }, [value]);

  const onClick = useCallback(() => {
    setIsEditing(true);
    setShouldFocus(true);
  }, []);

  const onChangeWrapper = useCallback(
    event => onChange(event.target.value),
    [onChange]
  );

  useEffect(() => {
    if (focus) {
      setShouldFocus(true);
    }
  }, [focus]);

  useEffect(() => {
    if (shouldFocus && isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing, shouldFocus]);

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
