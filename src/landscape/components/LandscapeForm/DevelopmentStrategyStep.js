import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { Typography } from '@mui/material';

import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

const VALIDATION_SCHEMA = yup.object().shape({}).required();

const FORM_FIELDS = [
  {
    name: 'form_development_objectives_description',
    renderStaticElement: ({ t }) => (
      <Typography sx={{ pl: 2 }}>
        {t('landscape.form_development_objectives_description')}
      </Typography>
    ),
  },
  {
    name: 'developmentStrategy.objectives',
    label: 'landscape.form_development_objectives',
    placeholder: 'landscape.form_development_objectives_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 6,
      },
    },
  },
  {
    name: 'form_development_problem_situtation_description',
    renderStaticElement: ({ t }) => (
      <Typography sx={{ pl: 2 }}>
        {t('landscape.form_development_problem_situtation_description')}
      </Typography>
    ),
  },
  {
    name: 'developmentStrategy.problemSitutation',
    label: 'landscape.form_development_problem_situtation',
    placeholder: 'landscape.form_development_problem_situtation_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 2,
      },
    },
  },
  {
    name: 'developmentStrategy.interventionStrategy',
    label: 'landscape.form_development_intervention_strategy',
    placeholder: 'landscape.form_development_intervention_strategy_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 3,
      },
    },
  },
  {
    name: 'form_development_other_information_description',
    renderStaticElement: ({ t }) => (
      <Typography sx={{ pl: 2 }}>
        {t('landscape.form_development_other_information_description')}
      </Typography>
    ),
  },
  {
    name: 'developmentStrategy.otherInformation',
    label: 'landscape.form_development_other_information',
    placeholder: 'landscape.form_development_other_information_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 3,
      },
    },
  },
];

const DevelopmentStrategyStep = props => {
  const { t } = useTranslation();
  const { setUpdatedLandscape, landscape, isNew, onCancel, onSave } = props;
  const [updatedValues, setUpdatedValues] = useState();

  return (
    <>
      <PageHeader
        typographyProps={{
          id: 'landscape-form-page-title',
          variant: 'h1',
          component: 'h2',
        }}
        header={t('landscape.form_development_update_title')}
      />
      <Form
        aria-labelledby="main-heading"
        prefix="landscape-development"
        localizationPrefix="landscape.form_development"
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
    <DevelopmentStrategyStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
