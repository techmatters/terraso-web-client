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
        .setAttribute('content', fullDescription);
      document
        .querySelector('meta[property="og:description"]')
        .setAttribute('content', fullDescription);
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
