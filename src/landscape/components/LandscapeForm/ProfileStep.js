import React, { useMemo, useState } from 'react';

import languages from '@cospired/i18n-iso-languages';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LANGUAGE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';
import * as yup from 'yup';

import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';

import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

// Support spanish & english languages.
languages.registerLocale(require('@cospired/i18n-iso-languages/langs/en.json'));
languages.registerLocale(require('@cospired/i18n-iso-languages/langs/es.json'));

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
    population: yup.number().notRequired().positive().integer(),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'areaTypes',
    label: 'landscape.form_profile_area_types',
    props: {
      renderInput: ({ id, field }) => <AreaTypesCheckboxes field={field} />,
    },
  },
  {
    name: 'taxonomyTypeTerms.ecosystem-type',
    label: 'landscape.form_profile_ecosystem_types',
    info: 'landscape.form_profile_ecosystem_types_info',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
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
      renderInput: ({ id, field }) => <LanguageAutocomplete field={field} />,
    },
  },
  {
    name: 'population',
    type: 'number',
    label: 'landscape.form_profile_population',
    placeholder: 'landscape.form_profile_population_placeholder',
  },
  {
    notControlledRender: () => <LivelihoodsInfo />,
  },
  {
    name: 'taxonomyTypeTerms.livelihood',
    label: 'landscape.form_profile_livelihoods',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          type={TYPE_LIVELIHOOD}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_livelihoods_placeholder"
        />
      ),
    },
  },
  {
    notControlledRender: () => <CommoditiesInfo />,
  },
  {
    name: 'taxonomyTypeTerms.commodity',
    label: 'landscape.form_profile_commondities',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          type={TYPE_COMMODITY}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_commondities_placeholder"
        />
      ),
    },
  },
];

const LivelihoodsInfo = () => {
  const { t } = useTranslation();
  return (
    <Typography sx={{ pl: 2 }}>
      {t('landscape.form_profile_livelihoods_info')}
    </Typography>
  );
};

const CommoditiesInfo = () => {
  const { t } = useTranslation();
  return (
    <Typography sx={{ pl: 2 }}>
      {t('landscape.form_profile_commondities_info')}
    </Typography>
  );
};

const LanguageAutocomplete = props => {
  const { field } = props;
  const languagesEn = useMemo(() => languages.getNames('en'), []);
  const languagesEs = useMemo(() => languages.getNames('es'), []);
  const terms = useMemo(
    () =>
      Object.keys(languagesEn).map(langCode => ({
        type: TYPE_LANGUAGE,
        valueOriginal: langCode,
        valueEn: languagesEn[langCode],
        valueEs: languagesEs[langCode],
      })),
    [languagesEn, languagesEs]
  );

  return (
    <TaxonomyAutocomplete
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
      field.onChange([...field.value, key]);
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
      <Form
        aria-labelledby="main-heading"
        prefix="dataset-config"
        localizationPrefix="landscape.form_profile"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        isMultiStep
        onChange={setUpdatedValues}
      />
      <Actions
        isNew={isNew}
        onCancel={onCancel}
        onSave={onSave}
        updatedValues={updatedValues}
        setUpdatedLandscape={setUpdatedLandscape}
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
