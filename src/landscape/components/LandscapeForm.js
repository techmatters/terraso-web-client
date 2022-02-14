import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';
import { useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageLoader from 'layout/PageLoader';
import PageHeader from 'layout/PageHeader';
import PageContainer from 'layout/PageContainer';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().required(),
    description: yup.string().maxCustom(600).required(),
    website: yup.string().url(),
  })
  .required();

const FIELDS = [
  {
    name: 'name',
    label: 'landscape.form_name_label',
  },
  {
    name: 'description',
    label: 'landscape.form_description_label',
    placeholder: 'landscape.form_description_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 4,
      },
    },
  },
  {
    name: 'website',
    label: 'landscape.form_website_label',
    info: 'landscape.form_website_info',
    placeholder: 'landscape.form_website_placeholder',
    type: 'url',
  },
  {
    name: 'location',
    label: 'landscape.form_location_label',
    info: 'landscape.form_location_info',
  },
];

const LandscapeForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { slug } = useParams();
  const { fetching, landscape } = useSelector(state => state.landscape.form);

  const isNew = !slug;

  useDocumentTitle(
    !isNew
      ? t('landscape.form_edit_document_title', {
          name: _.getOr('', 'name', landscape),
        })
      : t('landscape.form_new_document_title'),
    fetching
  );

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues());
      return;
    }
    dispatch(fetchLandscapeForm(slug));
  }, [dispatch, slug, isNew]);

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch, slug, isNew]
  );

  useEffect(() => {
    if (landscape && landscape.slug !== slug) {
      // Change URL if new landscape ID
      navigate(`/landscapes/${landscape.slug}/edit`);
    }
  }, [slug, landscape, navigate]);

  const onSave = updatedLandscape => dispatch(saveLandscape(updatedLandscape));

  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.getOr('', 'name', landscape) })
    : t('landscape.form_new_title');

  return (
    <PageContainer>
      {fetching && <PageLoader />}
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={title}
      />
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        fields={FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel="landscape.form_save_label"
      />
    </PageContainer>
  );
};

export default LandscapeForm;
