import React, { useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { Box, TextareaAutosize, Typography } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import Actions from './Actions';

const VALIDATION_SCHEMA = yup.object().shape({}).required();

const getTextAreaProps = minRows => ({
  inputProps: {
    inputComponent: TextareaAutosize,
    inputProps: {
      minRows,
    },
  },
});

const OpportunitiesHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Trans i18nKey="landscape.form_development_opportunities_helper_text">
        prefix
        <ExternalLink
          href={t('landscape.form_development_opportunities_helper_text_url')}
        >
          text
        </ExternalLink>
      </Trans>
    </Box>
  );
};

const DevelopmentStrategyHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Trans i18nKey="landscape.form_development_problem_situtation_helper_text">
        prefix
        <ExternalLink
          href={t(
            'landscape.form_development_problem_situtation_helper_text_url'
          )}
        >
          text
        </ExternalLink>
      </Trans>
    </Box>
  );
};

const InterventionStrategyHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Trans i18nKey="landscape.form_development_intervention_strategy_helper_text">
        prefix
        <ExternalLink
          href={t(
            'landscape.form_development_intervention_strategy_helper_text_url_landscape'
          )}
        >
          text
        </ExternalLink>
        <ExternalLink
          href={t(
            'landscape.form_development_intervention_strategy_helper_text_url_finance'
          )}
        >
          text
        </ExternalLink>
      </Trans>
    </Box>
  );
};

const ObjectivesHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Trans i18nKey="landscape.form_development_goals_helper_text">
        prefix
        <ul>
          <li>item</li>
          <li>item</li>
          <li>item</li>
          <li>item</li>
        </ul>
        <ExternalLink
          href={t('landscape.form_development_goals_helper_text_url')}
        >
          text
        </ExternalLink>
      </Trans>
    </Box>
  );
};

const FORM_FIELDS = [
  {
    name: 'form_development_goals_description',
    renderStaticElement: ({ t }) => (
      <Typography sx={{ pl: 2 }}>
        {t('landscape.form_development_goals_description')}
      </Typography>
    ),
  },
  {
    name: 'developmentStrategy.objectives',
    label: 'landscape.form_development_goals',
    helperText: {
      Component: ObjectivesHelperText,
    },
    placeholder: 'landscape.form_development_goals_placeholder',
    props: getTextAreaProps(6),
  },
  {
    name: 'developmentStrategy.opportunities',
    label: 'landscape.form_development_opportunities',
    helperText: {
      Component: OpportunitiesHelperText,
    },
    placeholder: 'landscape.form_development_opportunities_placeholder',
    props: getTextAreaProps(3),
  },
  {
    name: 'developmentStrategy.problemSitutation',
    label: 'landscape.form_development_problem_situtation',
    helperText: {
      Component: DevelopmentStrategyHelperText,
    },
    placeholder: 'landscape.form_development_problem_situtation_placeholder',
    props: getTextAreaProps(3),
  },
  {
    name: 'developmentStrategy.interventionStrategy',
    label: 'landscape.form_development_intervention_strategy',
    helperText: {
      Component: InterventionStrategyHelperText,
    },
    placeholder: 'landscape.form_development_intervention_strategy_placeholder',
    props: getTextAreaProps(3),
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
