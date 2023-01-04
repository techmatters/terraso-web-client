import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Autocomplete, TextField, createFilterOptions } from '@mui/material';

import { getTermLabel } from 'taxonomies/taxonomiesUtils';

const FILTER = createFilterOptions();

const TaxonomyAutocomplete = props => {
  const { i18n, t } = useTranslation();
  const { type, placeholder, terms, value, onChange, freeSolo, id } = props;
  const stateTerms = useSelector(_.get(`taxonomies.terms.values.${type}.list`));
  const options = useMemo(() => terms || stateTerms || [], [terms, stateTerms]);

  const getLabel = useCallback(
    option =>
      option.newTerm
        ? t('taxonomies.add_option', { value: option.newTerm })
        : getTermLabel(option, i18n.resolvedLanguage),
    [i18n.resolvedLanguage, t]
  );

  const sortedOptions = useMemo(
    () => _.sortBy(getLabel, options),
    [getLabel, options]
  );

  const onChangeWrapper = useCallback(
    (event, newValue) => {
      onChange(
        newValue.map(option => {
          const isNewValue = option.newTerm || typeof option === 'string';
          if (isNewValue) {
            const valueOriginal = option.newTerm || option;
            return {
              valueOriginal,
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
      id={id}
      freeSolo={freeSolo}
      clearOnBlur
      multiple
      value={value || []}
      onChange={onChangeWrapper}
      options={sortedOptions}
      getOptionLabel={getLabel}
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
              const newTerm = _.trim(inputValue);
              if (_.isEmpty(newTerm) || isExisting) {
                return filtered;
              }

              return [
                ...filtered,
                {
                  newTerm: inputValue,
                },
              ];
            },
          }
        : {})}
    />
  );
};

export default TaxonomyAutocomplete;
