import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDocumentTitle = (title, fetching) => {
  const { t } = useTranslation();

  const fullTitle = fetching
    ? t('common.terraso_projectName')
    : `${title} | ${t('common.terraso_projectName')}`;

  useEffect(() => {
    console.log({ fullTitle });
    if (fullTitle) {
      document.title = fullTitle;
    }
  }, [fullTitle]);
};
