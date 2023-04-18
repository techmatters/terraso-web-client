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
import { useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

export const useDocumentTitle = (title, fetching, omitSuffix = false) => {
  const { t } = useTranslation();

  const titleParts = [
    title,
    omitSuffix ? null : t('common.terraso_projectName'),
  ];

  const fullTitle = _.compact(titleParts).join(' | ');

  useEffect(() => {
    if (!fetching && fullTitle) {
      document.title = fullTitle;
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute('content', fullTitle);
    }
  }, [fetching, fullTitle]);
};

export const useDocumentDescription = (description, fetching) => {
  const { t } = useTranslation();

  const fullDescription = description.trim() || t('site.description');

  useEffect(() => {
    if (!fetching && fullDescription) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', fullDescription);
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute('content', fullDescription);
    }
  }, [fetching, fullDescription]);
};

export const useDocumentImage = (image, fetching) => {
  const { t } = useTranslation();

  const imageUrl = image || t('site.default_image');

  useEffect(() => {
    if (!fetching && imageUrl) {
      document
        .querySelector('meta[property="og:image"]')
        .setAttribute('content', imageUrl);
    }
  }, [fetching, imageUrl]);
};
