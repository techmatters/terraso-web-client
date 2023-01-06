import React, { useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';

import HelperText from 'common/components/HelperText';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';
import { iso639en, iso639es } from 'localization/iso639';

import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import {
  TYPE_AGRICULTURAL_PRODUCTION_METHOD,
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LANGUAGE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';

import { AGRICULTURAL_PRODUCTION_METHOD_LIVELIHOODS } from 'config';
import { withProps } from 'react-hoc';

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

const AreaTypesHelperText = props => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pt: 0, width: 340 }}>
      <Typography sx={{ maxWidth: 307 }}>
        <Trans
          i18nKey={`landscape.form_profile_area_types_helper_text_${props.areaType}`}
        />
      </Typography>
      <img
        src={`/landscape/${props.areaType}.jpg`}
        alt={t(`landscape.profile_profile_card_area_types_${props.areaType}`)}
      />
    </Box>
  );
};

const EcosystemTypesHelperText = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Trans i18nKey="landscape.form_profile_ecosystem_types_helper_text" />
    </Box>
  );
};

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
    helperText: {
      titleKey: 'landscape.form_profile_ecosystem_types_helper_text_title',
      Component: EcosystemTypesHelperText,
    },
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
    helperText: {
      i18nKey: 'landscape.form_profile_languages_helper_text',
    },
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
    helperText: {
      i18nKey: 'landscape.form_profile_population_helper_text',
    },
    placeholder: 'landscape.form_profile_population_placeholder',
    props: {
      inputProps: {
        inputProps: {
          min: 1,
        },
      },
    },
  },
  {
    name: 'taxonomyTypeTerms.livelihood',
    label: 'landscape.form_profile_livelihoods',
    helperText: {
      i18nKey: 'landscape.form_profile_livelihoods_helper_text',
    },
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
    name: 'taxonomyTypeTerms.agricultural-production-method',
    label: 'landscape.form_profile_agricultural_production_methods',
    helperText: {
      i18nKey:
        'landscape.form_profile_agricultural_production_methods_helper_text',
    },
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          id={id}
          freeSolo
          type={TYPE_AGRICULTURAL_PRODUCTION_METHOD}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_agricultural_production_methods_placeholder"
        />
      ),
    },
  },
  {
    name: 'taxonomyTypeTerms.commodity',
    label: 'landscape.form_profile_commondities',
    helperText: {
      i18nKey: 'landscape.form_profile_commondities_helper_text',
    },
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

const LanguageAutocomplete = props => {
  const { field, id } = props;
  const languagesEn = useMemo(() => iso639en(), []);
  const languagesEs = useMemo(() => iso639es(), []);
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
    <Stack direction="row" spacing={3}>
      {options.map(option => (
        <FormControlLabel
          key={option.key}
          control={
            <Checkbox
              checked={_.includes(option.key, field.value)}
              onChange={handleChange(option.key)}
            />
          }
          label={
            <>
              {t(option.labelKey)}

              <HelperText
                Component={withProps(AreaTypesHelperText, {
                  areaType: option.key,
                })}
                label="landscape.form_profile_partnership_status"
              />
            </>
          }
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
        filterField={(field, { getValues }) => {
          if (
            field.name !== 'taxonomyTypeTerms.agricultural-production-method'
          ) {
            return true;
          }
          const livelihoods = getValues('taxonomyTypeTerms.livelihood');
          if (_.isEmpty(livelihoods)) {
            return false;
          }
          const values = livelihoods.map(
            livelihood => livelihood.valueOriginal
          );
          return !_.isEmpty(
            _.intersection(values, AGRICULTURAL_PRODUCTION_METHOD_LIVELIHOODS)
          );
        }}
      />
      <Actions
        isForm
        isNew={isNew}
        onCancel={onCancel}
        onSave={onSave}
        updatedValues={updatedValues}
        nextLabel={t('landscape.form_add_profile_label')}
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
