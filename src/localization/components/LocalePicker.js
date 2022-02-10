import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Select as SelectBase, MenuItem } from '@mui/material';

import { LOCALES } from 'localization/i18n';
import theme from 'theme';

const Select = styled(SelectBase)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.gray.lite1,
    borderRadius: 0,
  },
  '& .MuiInputBase-input': {
    backgroundColor: theme.palette.gray.lite1,
    fontSize: 12,
    padding: theme.spacing(1),
  },
}));

const LocalePicker = () => {
  const { t, i18n } = useTranslation();

  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = event => {
    const locale = _.get('target.value', event);
    i18n.changeLanguage(locale);
  };

  const getLocaleLabel = locale =>
    isSmall
      ? `localization.locale_${locale}_small`
      : `localization.locale_${locale}`;

  // Only show language picker if at least two languages are available.
  if (Object.keys(LOCALES).length <= 1) {
    return null;
  }

  const currentLocale = i18n.resolvedLanguage;

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
          {t(getLocaleLabel(locale)).toUpperCase()}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LocalePicker;
