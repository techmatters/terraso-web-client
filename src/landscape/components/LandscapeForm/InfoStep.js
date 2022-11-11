import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as yup from 'yup';

import { MenuItem, Select, Typography } from '@mui/material';

import { countriesList, countryMap, transformURL } from 'common/utils';
import Form from 'forms/components/Form';
import PageHeader from 'layout/PageHeader';
import { scrollToNavBar } from 'navigation/scrollTo';

import { MAX_DESCRIPTION_LENGTH } from 'config';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().trim().required(),
    description: yup
      .string()
      .maxCustom(MAX_DESCRIPTION_LENGTH)
      .trim()
      .required(),
    website: yup.string().trim().ensure().transform(transformURL).url(),
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

  const countries = countriesList();
  const countryHash = countryMap(countries);

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId="landscape-location-label"
      id="landscape-country"
      renderValue={selected =>
        countryHash[selected] || (
          <Typography sx={{ color: 'gray.mid2' }}>
            {t('landscape.form_location_placeholder')}
          </Typography>
        )
      }
    >
      <MenuItem value={''}>{t('landscape.form_location_select')}</MenuItem>
      {countries.map((country, index) => (
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
  const { setUpdatedLandscape, landscape } = props;
  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.getOr('', 'name', landscape) })
    : t('landscape.form_new_title');

  const onSave = updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    scrollToNavBar();
  };

  return (
    <>
      <PageHeader
        typographyProps={{
          id: 'landscape-form-page-title',
          variant: 'h1',
          component: 'h2',
        }}
        header={title}
      />
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel={
          isNew ? 'landscape.form_info_next' : 'landscape.form_save_label'
        }
        cancelLabel="landscape.form_info_cancel"
        onCancel={() => navigate(-1)}
        isMultiStep={isNew}
      />
    </>
  );
};

export default InfoStep;
