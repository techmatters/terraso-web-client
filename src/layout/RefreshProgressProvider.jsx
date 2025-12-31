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

import { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearProgress } from '@mui/material';

const RefreshProgressContext = createContext();

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
