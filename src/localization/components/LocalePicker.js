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

import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { savePreference } from 'terraso-client-shared/account/accountSlice';

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
