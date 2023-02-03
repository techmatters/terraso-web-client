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
import React from 'react';

import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';

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
  const { loading, allowed } = usePermission(permission, resource);

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
