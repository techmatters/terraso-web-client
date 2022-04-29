import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash/fp';

import { savePreference } from 'account/accountSlice';
import LocalePickerSelect from 'localization/components/LocalePickerSelect';
import { LOCALES } from 'localization/i18n';

const LocalePicker = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector(
    _.get('account.currentUser.data.preferences.language')
  );
  const userEmail = useSelector(_.get('account.currentUser.data.email'));

  useEffect(() => {
    // Set user preferred language
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const handleChange = locale => {
    i18n.changeLanguage(locale);
    if (userEmail) {
      dispatch(savePreference({ key: 'language', value: locale }));
    }
  };

  // Only show language picker if at least two languages are available.
  if (Object.keys(LOCALES).length <= 1) {
    return null;
  }

  const currentLocale = i18n.resolvedLanguage;

  return (
    <LocalePickerSelect locale={currentLocale} onLocaleChange={handleChange} />
  );
};

export default LocalePicker;
