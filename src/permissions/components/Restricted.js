import React from 'react';
import { useTranslation } from 'react-i18next';

import { usePermission } from 'permissions';

import { CircularProgress } from '@mui/material';

const Restricted = props => {
  const { t } = useTranslation();
  const {
    permission,
    resource,
    FallbackComponent,
    LoadingComponent,
    children,
  } = props;
  const [loading, allowed] = usePermission(permission, resource);

  if (loading) {
    return LoadingComponent ? (
      <LoadingComponent />
    ) : (
      <CircularProgress aria-label={t('common.loader_label')} />
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (!FallbackComponent) {
    return null;
  }

  return <FallbackComponent />;
};

export default Restricted;
