/*
 * Copyright © 2023 Technology Matters
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

import { useCallback } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import {
  Autocomplete,
  createFilterOptions,
  Paper,
  TextField,
} from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

const FILTER = createFilterOptions();

const FILTER_EMAILS = values =>
  values.filter(value => {
    try {
      return yup.string().email().validateSync(value);
    } catch (error) {
      return false;
    }
  });

const UserEmailAutocomplete = props => {
  const { t } = useTranslation();
  const { value, onChange, id, label, helperText } = props;

  const getLabel = useCallback(
    option => (typeof option === 'string' ? option : option?.newTerm || ''),
    []
  );

  const onChangeWrapper = useCallback(
    (event, newValue) => {
      const values = newValue.flatMap(option => {
        const isNewValue = option.newTerm || typeof option === 'string';
        if (isNewValue) {
          const valueOriginal = option.newTerm || option;
          return _.flow(
            _.split(' '),
            _.map(_.trim),
            _.compact
          )(valueOriginal.trim());
        }
        return option;
      });
      const filteredEmails = FILTER_EMAILS(values);
      onChange(filteredEmails);
    },
    [onChange]
  );

  return (
    <Autocomplete
      id={id}
      freeSolo
      multiple
      autoSelect
      value={value || []}
      onChange={onChangeWrapper}
      options={[]}
      getOptionLabel={getLabel}
      renderInput={params => (
        <TextField
          label={label}
          {...params}
          placeholder={t('common.user_email_autocomplete_placeholder')}
          type="email"
          helperText={helperText}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
      )}
      isOptionEqualToValue={(option, value) => option === value}
      filterOptions={(options, params) => {
        const filtered = FILTER(options, params);

        const { inputValue } = params;

        if (_.isEmpty(inputValue)) {
          return filtered;
        }

        return [
          ...filtered,
          {
            newTerm: inputValue,
          },
        ];
      }}
      slots={{
        paper: withProps(Paper, { elevation: 3 }),
      }}
    />
  );
};

export default UserEmailAutocomplete;
