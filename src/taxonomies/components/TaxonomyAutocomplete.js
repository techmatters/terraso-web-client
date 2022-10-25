import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Autocomplete, TextField } from '@mui/material';

import { getTermLabel } from 'taxonomies/taxonomiesUtils';

const TaxonomyAutocomplete = props => {
  const { i18n, t } = useTranslation();
  const { type, placeholder, terms, value, onChange } = props;
  const stateTerms = useSelector(_.get(`taxonomies.terms.${type}.list`));
  const options = terms || stateTerms;

  const getLabel = useCallback(
    option => getTermLabel(option, i18n.resolvedLanguage),
    [i18n.resolvedLanguage]
  );

  const onChangeWrapper = useCallback(
    (event, newValue) => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <Autocomplete
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
    />
  );
};

export default TaxonomyAutocomplete;
