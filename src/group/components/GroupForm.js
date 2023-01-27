﻿/*
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
import { useNavigate, useParams } from 'react-router-dom';
import * as yup from 'yup';

import {
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import { useDocumentTitle } from 'common/document';
import { transformURL } from 'common/utils';
import Form from 'forms/components/Form';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { useFetchData } from 'state/utils';

import {
  fetchGroupForm,
  resetFormSuccess,
  saveGroup,
  setFormNewValues,
} from 'group/groupSlice';
import {
  MEMBERSHIP_CLOSED,
  MEMBERSHIP_OPEN,
} from 'group/membership/components/groupMembershipConstants';

import { MAX_DESCRIPTION_LENGTH } from 'config';

import theme from 'theme';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().trim().required(),
    description: yup.string().max(MAX_DESCRIPTION_LENGTH).trim().required(),
    email: yup.string().trim().email(),
    website: yup.string().trim().ensure().transform(transformURL).url(),
    membershipType: yup.string(),
  })
  .required();

const FIELDS = [
  {
    name: 'name',
    label: 'group.form_name_label',
  },
  {
    name: 'description',
    label: 'group.form_description_label',
    placeholder: 'group.form_description_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 4,
      },
    },
  },
  {
    name: 'email',
    label: 'group.form_email_label',
    placeholder: 'group.form_email_placeholder',
    type: 'email',
  },
  {
    name: 'website',
    label: 'group.form_website_label',
    placeholder: 'group.form_website_placeholder',
    type: 'url',
  },
  {
    name: 'membershipType',
    label: 'group.form_membershipType_label',
    defaultValue: MEMBERSHIP_OPEN,
    props: {
      renderInput: ({ field }) => (
        <MembershipRadioButtons value={field.value} onChange={field.onChange} />
      ),
    },
  },
];

const MembershipRadioButton = props => {
  const { value, label, description, sx } = props;
  return (
    <FormControlLabel
      value={value}
      control={
        <Radio
          sx={{ pt: 0 }}
          inputProps={{
            'aria-label': label,
          }}
        />
      }
      label={
        <Stack spacing={1}>
          <Typography variant="body1">{label}</Typography>
          <Typography variant="body2">{description}</Typography>
        </Stack>
      }
      sx={{ mb: 2, alignItems: 'flex-start', ...sx }}
    />
  );
};
const MembershipRadioButtons = props => {
  const { t } = useTranslation();
  const { value, onChange } = props;

  const handleChange = event => {
    onChange(event.target.value);
  };

  return (
    <RadioGroup
      aria-labelledby="group-membershipType-label"
      value={value}
      onChange={handleChange}
    >
      <MembershipRadioButton
        value={MEMBERSHIP_OPEN}
        label={t('group.membership_open_option')}
        description={t('group.membership_open_description')}
        sx={{ mb: 4 }}
      />
      <MembershipRadioButton
        value={MEMBERSHIP_CLOSED}
        label={t('group.membership_close_option')}
        description={t('group.membership_close_description')}
      />
    </RadioGroup>
  );
};

const GroupForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const { slug } = useParams();
  const { fetching, group, success } = useSelector(state => state.group.form);
  const { data: user } = useSelector(state => state.account.currentUser);

  const isNew = !slug;

  useDocumentTitle(
    !isNew
      ? t('group.form_edit_document_title', {
          name: _.getOr('', 'name', group),
        })
      : t('group.form_new_document_title'),
    fetching
  );

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues());
    }
  }, [dispatch, isNew]);

  useFetchData(
    useCallback(() => (!isNew ? fetchGroupForm(slug) : null), [slug, isNew])
  );

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch, slug, isNew]
  );

  useEffect(() => {
    if (success) {
      navigate(`/groups/${group.slug}`);
    }
    return () => {
      dispatch(resetFormSuccess());
    };
  }, [success, group, navigate, dispatch]);

  const onSave = group => {
    dispatch(
      saveGroup({
        group,
        user,
      })
    ).then(() => {
      if (isNew) {
        trackEvent('Create Group', {});
      }
    });
  };

  const onCancel = () => {
    navigate(-1);
  };

  const title = !isNew
    ? t('group.form_edit_title', { name: _.getOr('', 'name', group) })
    : t('group.form_new_title');

  return (
    <PageContainer>
      {fetching && <PageLoader />}
      <PageHeader
        header={title}
        typographyProps={{ id: 'group-form-page-title' }}
      />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      >
        {t('group.form_new_description')}
      </Typography>
      <Form
        aria-labelledby="group-form-page-title"
        prefix="group"
        fields={FIELDS}
        values={isNew ? { membershipType: MEMBERSHIP_OPEN } : group}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel={isNew ? 'group.form_create_label' : 'group.form_save_label'}
        onCancel={onCancel}
        cancelLabel="group.form_cancel_label"
      />
    </PageContainer>
  );
};

export default GroupForm;
