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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePickerSelect from 'localization/components/LocalePickerSelect';

import { saveUser } from 'account/accountSlice';
import { savePreference } from 'account/accountSlice';

import AccountAvatar from './AccountAvatar';

const VALIDATION_SCHEMA = yup
  .object({
    firstName: yup.string().trim().required(),
  })
  .required();

const FIELDS = [
  {
    name: 'firstName',
    label: 'account.form_first_name_label',
    info: 'account.form_first_name_info',
    props: {
      gridItemProps: {
        xs: 12,
        sm: 6,
      },
    },
  },
  {
    name: 'lastName',
    label: 'account.form_last_name_label',
    props: {
      gridItemProps: {
        xs: 12,
        sm: 6,
      },
    },
  },
  {
    name: 'preferences.language',
    label: 'account.form_language_label',
    props: {
      renderInput: ({ field }) => (
        <LocalePickerSelect
          locale={field.value}
          onLocaleChange={field.onChange}
        />
      ),
    },
  },
  {
    name: 'email',
    label: 'account.form_email_label',
    props: {
      renderInput: ({ field }) => field.value,
    },
  },
  {
    name: 'profilePicture',
    label: 'account.profile_picture',
    props: {
      renderInput: () => <ProfilePicture />,
    },
  },
];

const ProfilePicture = () => {
  const { data: user } = useSelector(state => state.account.currentUser);
  return (
    <AccountAvatar
      showAlt
      sx={{ width: 80, height: 80, fontSize: '1.5em' }}
      user={user}
    />
  );
};

const AccountProfile = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user, fetching } = useSelector(
    state => state.account.currentUser
  );

  useDocumentTitle(t('account.profile_document_title'));

  const onSave = updatedProfile => {
    // Save user data
    dispatch(
      saveUser(
        _.omit(
          ['profilePicture', 'preferences.language', 'email'],
          updatedProfile
        )
      )
    );

    // Save language preference
    const currentLanguage = _.get(['preferences', 'language'], user);
    const newLanguage = _.get(['preferences', 'language'], updatedProfile);
    if (newLanguage && newLanguage !== currentLanguage) {
      dispatch(savePreference({ key: 'language', value: newLanguage }));
    }

    navigate('/');
  };

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <PageHeader
        header={`${t('account.welcome')}, ${user.firstName} ${user.lastName}`}
      />

      <p>{t('account.name_and_profile')}</p>

      <Form
        aria-label={t('account.profile_form_label')}
        prefix="profile"
        fields={FIELDS}
        values={user}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel="account.form_save_label"
      />
    </PageContainer>
  );
};

export default AccountProfile;
