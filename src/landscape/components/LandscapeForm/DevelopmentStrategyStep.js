import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

const VALIDATION_SCHEMA = yup.object().shape({}).required();

const FORM_FIELDS = [
  {
    name: 'developmentStrategy.objectives',
    label: 'landscape.form_development_objectives',
    props: {
      inputProps: {
        multiline: true,
        rows: 6,
      },
    },
  },
  {
    name: 'developmentStrategy.problemSitutation',
    label: 'landscape.form_development_problem_situtation',
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
    props: {
      inputProps: {
        multiline: true,
        rows: 3,
      },
    },
  },
  {
    name: 'developmentStrategy.otherInformation',
    label: 'landscape.form_development_other_information',
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
    <DevelopmentStrategyStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
