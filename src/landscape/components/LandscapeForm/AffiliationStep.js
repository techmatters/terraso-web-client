import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Button, Stack } from '@mui/material';

import PageHeader from 'layout/PageHeader';

const Actions = props => {
  const { t } = useTranslation();
  const { isNew, onCancel } = props;
  if (isNew) {
    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
      >
        <Button variant="text" onClick={onCancel}>
          {t('landscape.form_back')}
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined">{t('landscape.form_save_now')}</Button>
          <Button variant="contained">{t('landscape.form_next')}</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
    >
      <Button variant="contained">{t('landscape.form_update')}</Button>
      <Button variant="text" onClick={onCancel}>
        {t('landscape.form_cancel')}
      </Button>
    </Stack>
  );
};

const AffiliationStep = props => {
  const { t } = useTranslation();
  const { setUpdatedLandscape, landscape, isNew, onCancel } = props;
  console.log({ setUpdatedLandscape, landscape, isNew });

  const title = !isNew
    ? t('landscape.form_affiliation_edit_title', {
        name: _.getOr('', 'name', landscape),
      })
    : t('landscape.form_affiliation_new_title');

  return (
    <>
      <PageHeader
        typographyProps={{
          id: 'landscape-form-page-title',
          variant: 'h1',
          component: 'h2',
        }}
        header={title}
      />
      <Actions isNew={isNew} onCancel={onCancel} />
    </>
  );
};

export default AffiliationStep;
