import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Container,
  Link,
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
} from '@mui/material';

import { useBreadcrumbs } from './Routes';
import { useBreadcrumbsContext } from './breadcrumbsContext';

const Breadcrumbs = () => {
  const { t } = useTranslation();
  const breadcrumbs = useBreadcrumbs();
  const { breadcrumbsParams } = useBreadcrumbsContext();
  const { loading = true } = breadcrumbsParams;

  if (loading || _.isEmpty(breadcrumbs)) {
    return null;
  }
  return (
    <Container
      maxWidth="xl"
      component={MuiBreadcrumbs}
      aria-label={t('navigation.breadcrumbs_label')}
      sx={{
        mt: 3,
      }}
    >
      <Link component={RouterLink} to="/">
        {t('home.title')}
      </Link>
      {breadcrumbs.map(({ to, label, current }) =>
        current ? (
          <Typography color="text.primary" key={to}>
            {t(label, breadcrumbsParams)}
          </Typography>
        ) : (
          <Link component={RouterLink} to={to} key={to}>
            {t(label, breadcrumbsParams)}
          </Link>
        )
      )}
    </Container>
  );
};

export default Breadcrumbs;
