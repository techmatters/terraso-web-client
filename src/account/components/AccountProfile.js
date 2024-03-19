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
import React, { useCallback, useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  fetchProfile,
  savePreference,
  saveUser,
} from 'terraso-client-shared/account/accountSlice';
import { useFetchData } from 'terraso-client-shared/store/utils';
import * as yup from 'yup';
import {
  Alert,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

import { useDocumentDescription, useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LocalePickerSelect from 'localization/components/LocalePickerSelect';
import { useAnalytics } from 'monitoring/analytics';
import { useReferrer } from 'navigation/navigationUtils';
import { profileCompleted } from 'account/accountProfileUtils';

import AccountAvatar from './AccountAvatar';

const VALIDATION_SCHEMA = yup
  .object({
    firstName: yup
      .string()
      .trim()
      .required()
      .label('account.form_first_name_label_singular'),
  })
  .required();

const FIELDS = [
  {
    name: 'firstName',
    label: 'account.form_first_name_label',
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
    name: 'notifications',
    renderStaticElement: ({ t }) => (
      <Grid item>
        <Typography
          variant="caption"
          component="p"
          size="small"
          sx={{ textTransform: 'uppercase', opacity: 0.6 }}
        >
          {t('account.form_notifications_section_label')}
        </Typography>
        <Typography sx={{ mt: 2, mb: 1 }}>
          {t('account.form_notifications_section_when_label')}
        </Typography>
      </Grid>
    ),
  },
  {
    name: 'preferences.group_notifications',
    props: {
      renderInput: ({ id, field }) => (
        <GroupNotificationsCheckbox field={field} />
      ),
      gridItemProps: {
        sx: {
          '&.MuiGrid-root.MuiGrid-item': {
            pt: 0,
          },
          pb: 0,
        },
      },
    },
  },
  {
    name: 'preferences.story_map_notifications',
    props: {
      renderInput: ({ id, field }) => (
        <StoryMapNotificationsCheckbox field={field} />
      ),
      gridItemProps: {
        sx: {
          '&.MuiGrid-root.MuiGrid-item': {
            pt: 0,
          },
          m: 0,
        },
      },
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

const PREFERENCE_KEYS = [
  'language',
  'group_notifications',
  'story_map_notifications',
];

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
  const { completeProfile } = useParams();
  const { data: user, fetching } = useSelector(_.get('account.profile'));

  useFetchData(fetchProfile);

  useDocumentTitle(t('account.profile_document_title'));
  useDocumentDescription(t('account.profile_document_description'));

  const { goToReferrer } = useReferrer();

  useEffect(
    () => () => {
      profileCompleted(user?.email);
    },
    [user?.email]
  );

  const onSave = updatedProfile => {
    // Save user data
    const saveUserPromise = dispatch(
      saveUser(
        _.omit(
          ['profilePicture', 'notifications', 'email'].concat(
            PREFERENCE_KEYS.map(key => `preferences.${key}`)
          ),
          updatedProfile
        )
      )
    );

    // Save language and notifications preferences
    const savePreferencesPromises = PREFERENCE_KEYS.map(preferenceKey => {
      const currentValue = _.get(['preferences', preferenceKey], user);
      const newValue = _.get(['preferences', preferenceKey], updatedProfile);

      // If both items are blank, we don't neeed to persist changes to the
      // database. newValue coments from user data and will be a string,
      // so the strict equality check below is not enough
      if (newValue === '' && typeof currentValue === 'undefined') {
        return null;
      }

      if (newValue !== currentValue) {
        if (_.endsWith(preferenceKey, 'notifications')) {
          trackEvent('preference.update', {
            props: { emailNotifications: newValue },
          });
        }

        return dispatch(
          savePreference({ key: preferenceKey, value: newValue.toString() })
        );
      }
      return null;
    });

    const allPromises = [saveUserPromise, ...savePreferencesPromises].filter(
      promise => Boolean(promise)
    );
    Promise.all(allPromises).then(responses => {
      const allSuccess = responses.every(
        response => _.get('meta.requestStatus', response) === 'fulfilled'
      );
      if (allSuccess) {
        goToReferrer(completeProfile ? '/' : '/account/profile');
      }
    });
  };

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <PageHeader header={t('account.profile')} />

      <Paper variant="outlined">
        {completeProfile && (
          <Alert
            severity="info"
            sx={({ spacing }) => ({ m: spacing(3, 3, 0, 3) })}
          >
            {t('account.profile_complete_message')}
          </Alert>
        )}
        <Form
          outlined={false}
          aria-label={t('account.profile_form_label')}
          prefix="profile"
          fields={FIELDS}
          values={user}
          validationSchema={VALIDATION_SCHEMA}
          onSave={onSave}
          saveLabel="account.form_save_label"
        />
      </Paper>
    </PageContainer>
  );
};

const BaseNotificationsCheckbox = props => {
  const { t } = useTranslation();
  const { field, formKey, label } = props;

  const handleChange = useCallback(
    event => {
      field.onChange(event.target.checked ? 'true' : 'false');
    },
    [field]
  );

  return (
    <FormControlLabel
      key={formKey}
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
      label={t(label)}
    />
  );
};

const GroupNotificationsCheckbox = withProps(BaseNotificationsCheckbox, {
  formKey: 'group_notifications',
  label: 'account.form_notifications_group_label',
});

const StoryMapNotificationsCheckbox = withProps(BaseNotificationsCheckbox, {
  formKey: 'story_map_notifications',
  label: 'account.form_notifications_story_map_label',
});

export default AccountProfile;
