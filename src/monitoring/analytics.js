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

import { useCallback } from 'react';
import Plausible from 'plausible-tracker';
import { useTranslation } from 'react-i18next';

import { PLAUSIBLE_DOMAIN, TERRASO_ENV } from 'config';

export const plausible = Plausible({
  domain: PLAUSIBLE_DOMAIN,
  trackLocalhost: TERRASO_ENV === 'development',
});

plausible.enableAutoPageviews();

export const useAnalytics = () => {
  const { i18n } = useTranslation();

  const trackEvent = useCallback(
    (name, options = {}) => {
      const extendedOptions = {
        ...options,
        props: {
          ...(options.props || {}),
          language: i18n.resolvedLanguage,
        },
      };
      plausible.trackEvent(name, extendedOptions);
    },
    [i18n.resolvedLanguage]
  );

  return { trackEvent };
};
