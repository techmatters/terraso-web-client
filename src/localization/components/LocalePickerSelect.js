import React from 'react';
import { useTranslation } from 'react-i18next';

import _ from 'lodash/fp';

import { MenuItem, Select as SelectBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { LOCALES } from 'localization/i18n';

import theme from 'theme';

const Select = styled(SelectBase)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.gray.lite1,
    borderRadius: 0,
  },
  '& .MuiInputBase-input': {
    backgroundColor: theme.palette.white,
    fontSize: theme.typography.body2.fontSize,
    padding: theme.spacing(1),
  },
}));

const LocalePickerSelect = props => {
  const { t, i18n } = useTranslation();
  const { locale, onLocaleChange } = props;

  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const getLocaleLabel = locale =>
    isSmall
      ? `localization.locale_${locale}_small`
      : `localization.locale_${locale}`;

  const currentLocale = locale || i18n.resolvedLanguage;

  const handleChange = event => {
    const locale = _.get('target.value', event);
    onLocaleChange(locale);
  };

  return (
    <Select
      size="small"
      value={currentLocale}
      onChange={handleChange}
      inputProps={{
        'aria-label': t('localization.locale_select_label', {
          name: t(getLocaleLabel(currentLocale)),
        }),
      }}
    >
      {Object.keys(LOCALES).map(locale => (
        <MenuItem key={locale} value={locale}>
          {t(getLocaleLabel(locale))}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LocalePickerSelect;
