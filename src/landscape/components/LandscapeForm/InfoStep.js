import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as yup from 'yup';

import { MenuItem, Select } from '@mui/material';

import { countriesList, transformURL } from 'common/utils';
import Form from 'forms/components/Form';
import PageHeader from 'layout/PageHeader';

const FORM_VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().required(),
    description: yup.string().maxCustom(600).required(),
    website: yup.string().ensure().transform(transformURL).url(),
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
  const { t } = useTranslation();
  const { field } = props;

  // country list for menu contents (must be sorted)
  const countriesArray = countriesList();

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId="landscape-location-label"
      sx={{
        width: '25%',
      }}
    >
      <MenuItem value={''}>{t('landscape.form_location_select')}</MenuItem>
      {countriesArray.map((country, index) => (
        <MenuItem key={index} value={country.code}>
          {country.name}
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
        isMultiStep
      />
    </>
  );
};

export default InfoStep;
