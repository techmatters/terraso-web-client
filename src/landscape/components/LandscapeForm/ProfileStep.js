import React, { useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import HelperText from 'common/components/HelperText';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';
import { iso639en, iso639es } from 'localization/iso639';

import { Subheader } from 'landscape/landscapeUtils';
import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LANGUAGE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';

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

const EcosystemTypesHelperText = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Trans i18nKey="landscape.form_profile_ecosystem_types_helper_text" />
    </Box>
  );
};

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
    helperText: {
      titleKey: 'landscape.form_profile_ecosystem_types_helper_text_title',
      closeIcon: true,
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
  },
  {
    name: 'livelihoods-info',
    renderStaticElement: () => <LivelihoodsInfo />,
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
    name: 'commondities-info',
    renderStaticElement: () => <CommoditiesInfo />,
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

const AreaTypeImage = props => {
  const { t } = useTranslation();
  const { areaType } = props;

  return (
    <Grid item>
      <Paper
        square
        variant="outlined"
        component={Stack}
        alignItems="center"
        justifyContent="center"
        sx={{ border: 'black', bgcolor: 'black', color: 'white' }}
      >
        <Typography>
          {t(`landscape.profile_profile_card_area_types_${areaType}`)}
        </Typography>
        <img
          src={`/landscape/${areaType}.jpg`}
          alt={t(`landscape.profile_profile_card_area_types_${areaType}`)}
        />
      </Paper>
    </Grid>
  );
};

const AreaTypesHelperText = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Trans i18nKey="landscape.form_profile_area_types_helper_text" />
      <Grid container spacing={2} justifyContent="center">
        <AreaTypeImage areaType="peri-urban" />
        <AreaTypeImage areaType="urban" />
        <AreaTypeImage areaType="rural" />
      </Grid>
    </Box>
  );
};

const AreaTypesInfo = () => {
  return (
    <Stack direction="row" alignItems="center">
      <Subheader text="landscape.form_profile_area_types" />
      <HelperText
        Component={AreaTypesHelperText}
        label="landscape.form_profile_area_types"
        closeIcon="true"
        useAnchor={false}
      />
    </Stack>
  );
};

const LivelihoodsInfo = () => {
  return <Subheader text="landscape.form_profile_livelihoods_info" />;
};

const CommoditiesInfo = () => {
  return <Subheader text="landscape.form_profile_commondities_info" />;
};

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
