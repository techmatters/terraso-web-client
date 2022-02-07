import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@mui/material';

const SkipLink = () => {
  const { t } = useTranslation();
  return (
    <Link className="sr-only sr-only-focusable" href="#content">
      {t('navigation.skip_to_main_content')}
    </Link>
  );
};

export default SkipLink;
