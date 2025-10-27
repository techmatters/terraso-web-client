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

import { useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { useHasServerSideMetaTags } from 'navigation/components/Routes';

export const useDocumentTitle = (title, fetching, omitSuffix = false) => {
  const { t } = useTranslation();
  const hasServerSideMetaTags = useHasServerSideMetaTags();

  const titleParts = [
    title,
    omitSuffix ? null : t('common.terraso_projectName'),
  ];

  const fullTitle = _.compact(titleParts).join(' | ');

  useEffect(() => {
    if (hasServerSideMetaTags) {
      return;
    }

    if (!fetching && fullTitle) {
      document.title = fullTitle;
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute('content', fullTitle);
    }
  }, [fetching, fullTitle, hasServerSideMetaTags]);
};

export const useDocumentDescription = (description, fetching) => {
  const { t } = useTranslation();
  const hasServerSideMetaTags = useHasServerSideMetaTags();

  const fullDescription = useMemo(() => {
    if (!description) {
      return t('site.description');
    }
    return description.trim();
  }, [description, t]);

  useEffect(() => {
    if (hasServerSideMetaTags) {
      return;
    }

    if (!fetching && fullDescription) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', fullDescription);
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute('content', fullDescription);
    }
  }, [fetching, fullDescription, hasServerSideMetaTags]);
};

export const useDocumentImage = (image, fetching) => {
  const { t } = useTranslation();
  const hasServerSideMetaTags = useHasServerSideMetaTags();

  const imageUrl = image || t('site.default_image');

  useEffect(() => {
    if (hasServerSideMetaTags) {
      return;
    }

    if (!fetching && imageUrl) {
      document
        .querySelector('meta[property="og:image"]')
        ?.setAttribute('content', imageUrl);
    }
  }, [fetching, imageUrl, hasServerSideMetaTags]);
};
