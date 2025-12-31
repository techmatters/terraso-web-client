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

import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { Box, TextareaAutosize, Typography } from '@mui/material';

import ExternalLink from 'terraso-web-client/common/components/ExternalLink';
import Form from 'terraso-web-client/forms/components/Form';
import { FormContextProvider } from 'terraso-web-client/forms/formContext';
import PageHeader from 'terraso-web-client/layout/PageHeader';
import Actions from 'terraso-web-client/landscape/components/LandscapeForm/Actions';

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
      <Typography>
        <Trans i18nKey="landscape.form_development_opportunities_helper_text">
          prefix
          <ExternalLink
            linkProps={{ display: 'inline-block', mt: 2 }}
            href={t('landscape.form_development_opportunities_helper_text_url')}
          >
            text
          </ExternalLink>
        </Trans>
      </Typography>
    </Box>
  );
};

const DevelopmentStrategyHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Typography>
        <Trans i18nKey="landscape.form_development_problem_situtation_helper_text">
          prefix
          <ExternalLink
            linkProps={{ display: 'inline-block', mt: 2 }}
            href={t(
              'landscape.form_development_problem_situtation_helper_text_url'
            )}
          >
            text
          </ExternalLink>
        </Trans>
      </Typography>
    </Box>
  );
};

const InterventionStrategyHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Trans i18nKey="landscape.form_development_intervention_strategy_helper_text">
        <Typography>prefix</Typography>
        <Typography sx={{ mt: 2 }}>
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
        </Typography>
      </Trans>
    </Box>
  );
};

const ObjectivesHelperText = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2, pr: 5 }}>
      <Typography>
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
      </Typography>
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
