import React, { useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';

import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import { Subheader } from 'landscape/landscapeUtils';
import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LANGUAGE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';

import iso639en from '../../../localization/iso639/en.json';
import iso639es from '../../../localization/iso639/es.json';
import Actions from './Actions';

const VALIDATION_SCHEMA = yup
  .object()
  .transform(
    _.flow(
      _.toPairs,
      _.filter(([key, value]) => !_.isEmpty(value)),
      _.fromPairs
    )
  )
  .shape({
    population: yup.number().notRequired().positive().integer().max(2147483647),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'areatypes-info',
    renderStaticElement: () => <AreaTypesInfo />,
  },
  {
    name: 'areaTypes',
    props: {
      renderInput: ({ id, field }) => <AreaTypesCheckboxes field={field} />,
    },
  },
  {
    name: 'taxonomyTypeTerms.ecosystem-type',
    label: 'landscape.form_profile_ecosystem_types',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          id={id}
          freeSolo
          type={TYPE_ECOSYSTEM_TYPE}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_ecosystem_types_placeholder"
        />
      ),
    },
  },
  {
    name: 'taxonomyTypeTerms.language',
    label: 'landscape.form_profile_languages',
    props: {
      renderInput: ({ id, field }) => (
        <LanguageAutocomplete id={id} field={field} />
      ),
    },
  },
  {
    name: 'population',
    type: 'number',
    label: 'landscape.form_profile_population',
    placeholder: 'landscape.form_profile_population_placeholder',
  },
  {
    name: 'livelihoods-info',
    renderStaticElement: () => <LivelihoodsInfo />,
  },
  {
    name: 'taxonomyTypeTerms.livelihood',
    label: 'landscape.form_profile_livelihoods',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          id={id}
          freeSolo
          type={TYPE_LIVELIHOOD}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_livelihoods_placeholder"
        />
      ),
    },
  },
  {
    name: 'commondities-info',
    renderStaticElement: () => <CommoditiesInfo />,
  },
  {
    name: 'taxonomyTypeTerms.commodity',
    label: 'landscape.form_profile_commondities',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          id={id}
          freeSolo
          type={TYPE_COMMODITY}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_commondities_placeholder"
        />
      ),
    },
  },
];

const AreaTypesInfo = () => {
  return <Subheader text="landscape.form_profile_area_types" />;
};

const LivelihoodsInfo = () => {
  return <Subheader text="landscape.form_profile_livelihoods_info" />;
};

const CommoditiesInfo = () => {
  return <Subheader text="landscape.form_profile_commondities_info" />;
};

const LanguageAutocomplete = props => {
  const { field, id } = props;
  const languagesEn = useMemo(() => iso639en, []);
  const languagesEs = useMemo(() => iso639es, []);
  const terms = useMemo(
    () =>
      Object.keys(languagesEn)
        .map(langCode => ({
          type: TYPE_LANGUAGE,
          valueOriginal: langCode,
          valueEn: languagesEn[langCode],
          valueEs: languagesEs[langCode],
        }))
        .sort((a, b) => a.valueEn.localeCompare(b.valueEn)),
    [languagesEn, languagesEs]
  );

  return (
    <TaxonomyAutocomplete
      id={id}
      terms={terms}
      value={field.value}
      onChange={field.onChange}
      placeholder="landscape.form_profile_languages_placeholder"
    />
  );
};

const AreaTypesCheckboxes = props => {
  const { t } = useTranslation();
  const { field } = props;
  const options = [
    {
      key: 'rural',
      labelKey: 'landscape.profile_profile_card_area_types_rural',
    },
    {
      key: 'peri-urban',
      labelKey: 'landscape.profile_profile_card_area_types_peri-urban',
    },
    {
      key: 'urban',
      labelKey: 'landscape.profile_profile_card_area_types_urban',
    },
  ];

  const handleChange = key => event => {
    const isChecked = event.target.checked;
    if (isChecked) {
      field.onChange([...(field.value || []), key]);
      return;
    }
    field.onChange(field.value.filter(item => item !== key));
  };

  return (
    <Stack direction="row">
      {options.map(option => (
        <FormControlLabel
          key={option.key}
          control={
            <Checkbox
              sx={{ pt: 0, pb: 0 }}
              checked={_.includes(option.key, field.value)}
              onChange={handleChange(option.key)}
            />
          }
          label={t(option.labelKey)}
        />
      ))}
    </Stack>
  );
};

const ProfileStep = props => {
  const { t } = useTranslation();
  const { setUpdatedLandscape, landscape, isNew, onCancel, onSave } = props;
  const [updatedValues, setUpdatedValues] = useState();

  const title = !isNew
    ? t('landscape.form_profile_edit_title', {
        name: _.getOr('', 'name', landscape),
      })
    : t('landscape.form_profile_new_title');

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
        {t('landscape.form_profile_description')}
      </Typography>
      <Form
        aria-labelledby="main-heading"
        prefix="landscape-profile"
        localizationPrefix="landscape.form_profile"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        isMultiStep
        onChange={setUpdatedValues}
      />
      <Actions
        isForm
        isNew={isNew}
        onCancel={onCancel}
        onSave={onSave}
        updatedValues={updatedValues}
        onNext={setUpdatedLandscape}
      />
    </>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <ProfileStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
