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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link, Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { useBreadcrumbsContext } from 'terraso-web-client/navigation/breadcrumbsContext';
import { useBreadcrumbs } from 'terraso-web-client/navigation/components/Routes';

const Breadcrumbs = () => {
  const { t } = useTranslation();
  const breadcrumbs = useBreadcrumbs();
  const { breadcrumbsParams } = useBreadcrumbsContext();
  const { loading = true } = breadcrumbsParams;

  if (loading || _.isEmpty(breadcrumbs)) {
    return null;
  }
  return (
    <>
      <Typography sx={visuallyHidden} variant="h2">
        {t('navigation.breadcrumbs_label')}
      </Typography>
      <MuiBreadcrumbs
        aria-label={t('navigation.breadcrumbs_label')}
        sx={{ mb: 2, mt: 2 }}
      >
        <Link component={RouterLink} to="/">
          {t('home.title')}
        </Link>
        {breadcrumbs.map(({ to, label, current }) => (
          <Link
            component={RouterLink}
            to={to}
            key={to}
            {...(current
              ? {
                  color: 'gray.dark1',
                  'aria-current': 'page',
                }
              : {})}
          >
            {t(label, breadcrumbsParams)}
          </Link>
        ))}
      </MuiBreadcrumbs>
    </>
  );
};

export default Breadcrumbs;
