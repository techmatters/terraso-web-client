import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import * as yup from 'yup';

import { Typography } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';

import {
  fetchGroupForm,
  resetFormSuccess,
  saveGroup,
  setFormNewValues,
} from 'group/groupSlice';

import theme from 'theme';

const transformURL = url => {
  if (url === '' || url.startsWith('http:') || url.startsWith('https:')) {
    return url;
  }

  return `https://${url}`;
};

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().required(),
    description: yup.string().maxCustom(600).required(),
    email: yup.string().email(),
    website: yup.string().ensure().transform(transformURL).url(),
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
];

const GroupForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      return;
    }
    dispatch(fetchGroupForm(slug));
  }, [dispatch, slug, isNew]);

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

  const onSave = group =>
    dispatch(
      saveGroup({
        group,
        user,
      })
    );

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
        values={group}
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
