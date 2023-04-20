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
import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import * as yup from 'yup';

import { Checkbox, FormControlLabel } from '@mui/material';

import { useDocumentDescription, useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePickerSelect from 'localization/components/LocalePickerSelect';
import { useAnalytics } from 'monitoring/analytics';
import { saveUser } from 'state/account/accountSlice';
import { savePreference } from 'state/account/accountSlice';
import { fetchProfile } from 'state/account/accountSlice';
import { useFetchData } from 'state/utils';

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
    name: 'preferences.notifications',
    label: 'account.form_notifications_section_label',
    props: {
      renderInput: ({ id, field }) => <NotificationsCheckboxes field={field} />,
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

const PREFERENCE_KEYS = ['language', 'notifications'];

const ProfilePicture = () => {
  const { data: user } = useSelector(_.get('account.profile'));
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
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { data: user, fetching } = useSelector(_.get('account.profile'));

  useFetchData(fetchProfile);

  useDocumentTitle(t('account.profile_document_title'));
  useDocumentDescription(t('account.profile_document_description'));

  const onSave = updatedProfile => {
    // Save user data
    dispatch(
      saveUser(
        _.omit(
          ['profilePicture', 'email'].concat(
            PREFERENCE_KEYS.map(key => `preferences.${key}`)
          ),
          updatedProfile
        )
      )
    );

    // Save language and notifications preferences
    PREFERENCE_KEYS.forEach(preferenceKey => {
      const currentValue = _.get(['preferences', preferenceKey], user);
      const newValue = _.get(['preferences', preferenceKey], updatedProfile);

      // If both items are blank, we don't neeed to persist changes to the
      // database. newValue coments from user data and will be a string,
      // so the strict equality check below is not enough
      if (newValue === '' && typeof currentValue === 'undefined') {
        return;
      }

      if (newValue !== currentValue) {
        dispatch(
          savePreference({ key: preferenceKey, value: newValue.toString() })
        );

        if (preferenceKey === 'notifications') {
          trackEvent('preference.update', {
            props: { emailNotifications: newValue },
          });
        }
      }
    });
  };

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <PageHeader header={t('account.profile')} />

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

const NotificationsCheckboxes = props => {
  const { t } = useTranslation();
  const { field } = props;

  const handleChange = useCallback(
    event => {
      field.onChange(event.target.checked ? 'true' : 'false');
    },
    [field]
  );

  return (
    <FormControlLabel
      key="notifications"
      control={
        <Checkbox
          sx={{ pt: 0 }}
          checked={field.value === 'true'}
          onChange={handleChange}
        />
      }
      sx={{
        alignItems: 'flex-start',
      }}
      label={t('account.form_notifications_label')}
    />
  );
};

export default AccountProfile;
