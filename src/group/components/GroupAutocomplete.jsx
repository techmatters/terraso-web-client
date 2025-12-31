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

import { useCallback, useMemo } from 'react';
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
    () => (_.isEmpty(props.value) ? (multiple ? [] : null) : props.value),
    [props.value, multiple]
  );

  return (
    <Autocomplete
      id={id}
      noOptionsText={t('group.autocomplete_no_options')}
      multiple={!!multiple}
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
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              'aria-labelledby': `${id}-label`,
            },
          }}
        />
      )}
      isOptionEqualToValue={(option, value) =>
        value?.slug && option.slug === value.slug
      }
    />
  );
};

export default GroupAutocomplete;
