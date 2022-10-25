import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Autocomplete, TextField, createFilterOptions } from '@mui/material';

const FILTER = createFilterOptions();

import { getTermLabel } from 'taxonomies/taxonomiesUtils';

const TaxonomyAutocomplete = props => {
  const { i18n, t } = useTranslation();
  const { type, placeholder, terms, value, onChange, freeSolo } = props;
  const stateTerms = useSelector(_.get(`taxonomies.terms.${type}.list`));
  const options = useMemo(() => terms || stateTerms || [], [terms, stateTerms]);

  const getLabel = useCallback(
    option =>
      option.newTerm
        ? t('taxonomies.add_option', { value: option.newTerm })
        : getTermLabel(option, i18n.resolvedLanguage),
    [i18n.resolvedLanguage, t]
  );

  const onChangeWrapper = useCallback(
    (event, newValue) => {
      onChange(
        newValue.map(option => {
          if (option.newTerm) {
            return {
              valueOriginal: option.newTerm,
              type,
            };
          }
          return option;
        })
      );
    },
    [onChange, type]
  );

  return (
    <Autocomplete
      freeSolo={freeSolo}
      clearOnBlur
      multiple
      value={value || []}
      onChange={onChangeWrapper}
      options={options}
      getOptionLabel={getLabel}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={t(placeholder)}
        />
      )}
      isOptionEqualToValue={(option, value) =>
        option.valueOriginal === value.valueOriginal
      }
      noOptionsText={t('taxonomies.no_options')}
      {...(freeSolo
        ? {
            filterOptions: (options, params) => {
              const filtered = FILTER(options, params);

              const { inputValue } = params;
              const isExisting = options.some(
                option => inputValue === option.valueOriginal
              );
              if (inputValue === '' || isExisting) {
                return filtered;
              }

              return [
                {
                  newTerm: inputValue,
                },
                ...filtered,
              ];
            },
          }
        : {})}
    />
  );
};

export default TaxonomyAutocomplete;
