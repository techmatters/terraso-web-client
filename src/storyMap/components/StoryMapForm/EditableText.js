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
import { TextField } from '@mui/material';

const EditableText = props => {
  const {
    Component,
    value,
    onChange,
    onBlur,
    placeholder,
    inputProps = {},
    focus,
    label,
  } = props;
  const [isEditing, setIsEditing] = useState(!value);
  const [shouldFocus, setShouldFocus] = useState(focus);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setIsEditing(true);
    }
  }, [value]);

  const onExit = useCallback(() => {
    onBlur?.();
    if (!value) {
      return;
    }
    setIsEditing(false);
  }, [value, onBlur]);

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
      <TextField
        label={label}
        inputRef={inputRef}
        fullWidth
        value={value}
        onBlur={onExit}
        onChange={onChangeWrapper}
        placeholder={placeholder}
        sx={{
          '& label.Mui-focused': {
            color: 'gray.lite1',
          },
        }}
        slotProps={{
          input: {
            ...inputProps,
            sx: {
              '& .MuiInputBase-input': {
                bgcolor: 'transparent',
                color: 'white',
              },
            },
          },

          inputLabel: {
            shrink: true,
            sx: { color: 'white' },
          },
        }}
      />
    );
  }

  return <Component onClick={onClick}>{value}</Component>;
};

export default EditableText;
