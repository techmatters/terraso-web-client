import { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

export const useDocumentTitle = (title, fetching, omitSuffix = false) => {
  const { t } = useTranslation();

  const titleParts = [
    fetching ? null : title,
    omitSuffix ? null : t('common.terraso_projectName'),
  ];

  const fullTitle = _.flow(
    _.filter(part => !_.isEmpty(part)),
    _.join(' | ')
  )(titleParts);

  useEffect(() => {
    if (fullTitle) {
      document.title = fullTitle;
    }
  }, [fullTitle]);
};
