import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Select as SelectBase, MenuItem } from '@mui/material';

import { LOCALES } from 'localization/i18n';
import { savePreference } from 'account/accountSlice';
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

const LocalePicker = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector(
    _.get('account.currentUser.data.preferences.language')
  );

  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Set user preferred language
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const handleChange = event => {
    const locale = _.get('target.value', event);
    i18n.changeLanguage(locale);
    dispatch(savePreference({ key: 'language', value: locale }));
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
          {t(getLocaleLabel(locale))}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LocalePicker;
