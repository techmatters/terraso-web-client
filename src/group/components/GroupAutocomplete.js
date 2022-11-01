import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Autocomplete, TextField } from '@mui/material';

const GroupAutocomplete = props => {
  const { t } = useTranslation();
  const { placeholder, onChange, multiple, id } = props;
  const options = useSelector(_.get('group.autocomplete.groups'));

  const onChangeWrapper = useCallback(
    (event, newValue) => {
      onChange(newValue);
    },
    [onChange]
  );

  const value = useMemo(
    () => (_.isEmpty(props.value) ? (multiple ? [] : '') : props.value),
    [props.value, multiple]
  );

  return (
    <Autocomplete
      id={id}
      noOptionsText={t('group.autocomplete_no_options')}
      multiple={multiple}
      value={value}
      onChange={onChangeWrapper}
      options={options}
      getOptionLabel={option => {
        return option?.name || '';
      }}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={t(placeholder)}
          inputProps={{
            ...params.inputProps,
            'aria-labelledby': `${id}-label`,
          }}
        />
      )}
      isOptionEqualToValue={(option, value) => option.slug === value.slug}
    />
  );
};

export default GroupAutocomplete;
