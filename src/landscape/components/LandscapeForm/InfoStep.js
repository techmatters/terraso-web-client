import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import countries from 'world-countries';
import * as yup from 'yup';

import { MenuItem, Select, Typography } from '@mui/material';

import Form from 'forms/components/Form';
import PageHeader from 'layout/PageHeader';

const FORM_VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().required(),
    description: yup.string().maxCustom(600).required(),
    website: yup.string().url(),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'name',
    label: 'landscape.form_name_label',
    placeholder: 'landscape.form_name_placeholder',
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
    name: 'location',
    label: 'landscape.form_location_label',
    props: {
      renderInput: ({ field }) => <CountrySelector field={field} />,
    },
  },
  {
    name: 'website',
    label: 'landscape.form_website_label',
    placeholder: 'landscape.form_website_placeholder',
    type: 'url',
  },
];

const CountrySelector = props => {
  const { i18n, t } = useTranslation();
  const { field } = props;

  const countriesLang = i18n.resolvedLanguage.startsWith('es')
    ? 'translations.spa.common'
    : 'name.common';

  const countriesList = countries.map(_.get(countriesLang)).sort();

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      sx={{ width: '100%' }}
      labelId="landscape-location-label"
      renderValue={selected =>
        selected || (
          <Typography sx={{ color: 'gray.mid2' }}>
            {t('landscape.form_location_placeholder')}
          </Typography>
        )
      }
    >
      {countriesList.map((country, index) => (
        <MenuItem key={index} value={country}>
          {country}
        </MenuItem>
      ))}
    </Select>
  );
};

const InfoStep = props => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const isNew = !slug;
  const { setActiveStepIndex, setUpdatedLandscape, landscape } = props;
  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.getOr('', 'name', landscape) })
    : t('landscape.form_new_title');

  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={title}
      />
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={FORM_VALIDATION_SCHEMA}
        onSave={updatedLandscape => {
          setUpdatedLandscape(updatedLandscape);
          setActiveStepIndex(current => current + 1);
        }}
        saveLabel="landscape.form_info_next"
        cancelLabel="landscape.form_info_cancel"
        onCancel={() => navigate(-1)}
        reverseActionsOrder
      />
    </>
  );
};

export default InfoStep;
