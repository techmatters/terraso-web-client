import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

const ProfileStep = props => {
  const { t } = useTranslation();
  const { setUpdatedLandscape, landscape, isNew, onCancel } = props;
  console.log({ setUpdatedLandscape, landscape, isNew });

  const title = !isNew
    ? t('landscape.form_profile_edit_title', {
        name: _.getOr('', 'name', landscape),
      })
    : t('landscape.form_profile_new_title');

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

export default ProfileStep;
