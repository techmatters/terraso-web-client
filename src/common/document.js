import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import _ from 'lodash/fp';

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
