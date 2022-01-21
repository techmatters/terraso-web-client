import React from 'react';
import * as yup from 'yup';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Grid, InputLabel, Stack, Typography } from '@mui/material';

import { saveUser } from 'account/accountSlice';
import Form from 'forms/components/Form';
import AccountAvatar from './AccountAvatar';
import PageLoader from 'common/components/PageLoader';
import theme from 'theme';

const VALIDATION_SCHEMA = yup
  .object({
    firstName: yup.string().required(),
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
    name: 'email',
    label: 'account.form_email_label',
    props: { guideText: true },
  },
];

const AccountProfile = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user, fetching } = useSelector(
    state => state.account.currentUser
  );

  const onSave = updatedProfile => {
    dispatch(saveUser(updatedProfile));
    navigate('/');
  };

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <Stack sx={{ maxWidth: 'sm', paddingTop: theme.spacing(3) }}>
      <Typography variant="h1">
        {t('account.welcome')}, {user.firstName} {user.lastName}
      </Typography>

      <p>{t('account.name_and_profile')}</p>

      <Form
        prefix="profile"
        fields={FIELDS}
        values={user}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel="account.form_save_label"
      >
        <Grid item xs={12}>
          <InputLabel>{t('account.profile_picture')}</InputLabel>
          <AccountAvatar
            sx={{ width: 80, height: 80, fontSize: '3em' }}
            user={user}
          />
        </Grid>
      </Form>
    </Stack>
  );
};

export default AccountProfile;
