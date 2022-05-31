import React, { useContext, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { LinearProgress } from '@mui/material';

const RefreshProgressContext = React.createContext();

export const RefreshProgressProvider = props => {
  const { t } = useTranslation();
  const [refresing, setRefreshing] = useState(false);
  return (
    <RefreshProgressContext.Provider value={{ setRefreshing }}>
      {refresing && (
        <LinearProgress
          aria-label={t('common.refreshing_loader_label')}
          sx={{ position: 'fixed', top: 0, width: '100%' }}
        />
      )}
      {props.children}
    </RefreshProgressContext.Provider>
  );
};

export const useRefreshProgressContext = () =>
  useContext(RefreshProgressContext);

export default RefreshProgressProvider;
