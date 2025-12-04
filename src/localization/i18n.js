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

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enUS from 'terraso-web-client/localization/locales/en-US.json';
import esES from 'terraso-web-client/localization/locales/es-ES.json';

export const LOCALES = {
  'en-US': {
    translation: enUS,
  },
  'es-ES': {
    translation: esES,
  },
};

i18n
  .use(
    new LanguageDetector(null, {
      order: [
        'querystring',
        'cookie',
        'localStorage',
        'sessionStorage',
        'navigator',
        'htmlTag',
        'path',
        'subdomain',
      ],
    })
  )
  .use(initReactI18next)
  .init({
    resources: LOCALES,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    fallbackLng: {
      default: ['en-US'],
    },
  });

i18n.services.formatter.add('errorParam', (value, lng, options) =>
  value ? `(${options.label}: ${value})` : null
);

i18n.services.formatter.add('lowercase', (value, lng, options) => {
  return i18n.t(value).toLowerCase();
});

export default i18n;
