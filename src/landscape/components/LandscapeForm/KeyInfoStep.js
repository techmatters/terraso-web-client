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
import React, { useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { MenuItem, Select, TextareaAutosize, Typography } from '@mui/material';

import CharacterCounter from 'common/components/CharacterCounter';
import { countriesList, countryMap } from 'common/countries';
import { transformURL } from 'common/utils';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

import { MAX_DESCRIPTION_LENGTH } from 'config';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().trim().required(),
    description: yup.string().max(MAX_DESCRIPTION_LENGTH).trim().required(),
    location: yup.string().trim().selected(),
    email: yup.string().trim().email(),
    website: yup
      .string()
      .trim()
      .ensure()
      .transform(transformURL)
      .validTld()
      .url(),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'name',
    label: 'landscape.form_name_label',
    helperText: {
      i18nKey: 'landscape.form_name_helper_text',
    },
    placeholder: 'landscape.form_name_placeholder',
  },
  {
    name: 'description',
    label: 'landscape.form_description_label',
    placeholder: 'landscape.form_description_placeholder',
    info: ({ field: { value } }) => (
      <CharacterCounter text={value} max={MAX_DESCRIPTION_LENGTH} />
    ),
    props: {
      inputProps: {
        inputComponent: TextareaAutosize,
        inputProps: {
          minRows: 4,
        },
      },
    },
  },
  {
    name: 'location',
    label: 'landscape.form_location_label',
    props: {
      renderInput: ({ field, fieldState, id }) => (
        <CountrySelector id={id} field={field} fieldState={fieldState} />
      ),
    },
  },
  {
    name: 'email',
    label: 'landscape.form_email_label',
    helperText: {
      i18nKey: 'landscape.form_email_helper_text',
    },
    placeholder: 'landscape.form_email_placeholder',
    type: 'email',
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
  const { id, field, fieldState } = props;

  const countries = countriesList();
  const countryHash = countryMap(countries);

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId="landscape-location-label"
      id={id}
      error={Boolean(fieldState?.error)}
      renderValue={selected =>
        countryHash[selected] || (
          <Typography sx={{ color: 'gray.mid2' }}>
            {t('landscape.form_location_placeholder')}
          </Typography>
        )
      }
    >
      <MenuItem value="">{t('landscape.form_location_select')}</MenuItem>
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
  const { data: user } = useSelector(_.get('account.currentUser'));
  const { setUpdatedLandscape, landscape, isNew } = props;
  const [updatedValues, setUpdatedValues] = useState();
  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.getOr('', 'name', landscape) })
    : t('landscape.form_new_title');

  const baseFormValues = useMemo(
    () => (isNew ? { ...landscape, email: user.email } : landscape),
    [isNew, landscape, user.email]
  );

  const formattedValues = useMemo(
    () => (updatedValues ? VALIDATION_SCHEMA.cast(updatedValues) : null),
    [updatedValues]
  );

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
      <Typography sx={{ mb: 4 }}>
        {t('landscape.form_new_description')}
      </Typography>
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        localizationPrefix="landscape.form_key_info"
        fields={FORM_FIELDS}
        values={baseFormValues}
        validationSchema={VALIDATION_SCHEMA}
        isMultiStep={isNew}
        onChange={setUpdatedValues}
      />
      <Actions
        isForm
        isNew={isNew}
        onCancel={() => navigate(-1)}
        updatedValues={formattedValues}
        onNext={setUpdatedLandscape}
        nextLabel={t('landscape.form_add_landscape_label')}
        updateLabel={t('landscape.form_save_label')}
      />
    </>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <InfoStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
