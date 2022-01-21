import React, { useEffect } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { Box, Typography } from '@mui/material';

import theme from 'theme';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';
import Form from 'forms/components/Form';
import PageLoader from 'common/components/PageLoader';

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
    ? t('landscape.form_edit_title', { name: _.get(landscape, 'name', '') })
    : t('landscape.form_new_title');

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      {fetching && <PageLoader />}
      <Typography variant="h1" sx={{ marginBottom: theme.spacing(5) }}>
        {title}
      </Typography>
      <Form
        prefix="landscape"
        fields={FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel="landscape.form_save_label"
      />
    </Box>
  );
};

export default LandscapeForm;
