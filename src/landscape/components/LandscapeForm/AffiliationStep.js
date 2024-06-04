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
import React, { useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import {
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import HelperText from 'common/components/HelperText';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';
import GroupAutocomplete from 'group/components/GroupAutocomplete';
import { Subheader } from 'landscape/landscapeUtils';
import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import { TYPE_ORGANIZATION } from 'taxonomies/taxonomiesConstants';

import Actions from './Actions';

const PARTNERSHIP_START_YEAR = 1900;

const VALIDATION_SCHEMA = yup.object().shape({}).required();

const FORM_FIELDS = [
  {
    name: 'partnershipStatus-info',
    renderStaticElement: () => <PartnershipStatusInfo />,
  },

  {
    name: 'partnershipStatus',
    props: {
      renderInput: ({ id, field }) => (
        <PartnershipStatusRadioGroup id={id} field={field} />
      ),
    },
  },
  {
    name: 'partnership.year',
    label: 'landscape.form_profile_partnership_year',
    helperText: {
      i18nKey: 'landscape.form_profile_partnership_year_helper_text',
    },
    type: 'number',
    props: {
      renderInput: ({ id, field }) => <YearSelect id={id} field={field} />,
    },
  },
  {
    name: 'partnership.group',
    label: 'landscape.form_profile_partnership_group',
    helperText: {
      i18nKey: 'landscape.form_profile_partnership_group_helper_text',
    },
    props: {
      renderInput: ({ id, field }) => (
        <GroupAutocomplete
          id={id}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_partnership_group_placeholder"
        />
      ),
    },
  },
  {
    name: `taxonomyTypeTerms.${TYPE_ORGANIZATION}`,
    label: 'landscape.form_profile_organizations',
    helperText: {
      i18nKey: 'landscape.form_profile_organizations_helper_text',
    },
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          id={id}
          freeSolo
          type={TYPE_ORGANIZATION}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_organizations_placeholder"
        />
      ),
    },
  },
  {
    name: 'affiliatedGroups',
    label: 'landscape.form_profile_affiliated_groups',
    helperText: {
      i18nKey: 'landscape.form_profile_affiliated_groups_helper_text',
    },
    props: {
      renderInput: ({ id, field }) => (
        <GroupAutocomplete
          id={id}
          multiple
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_affiliated_groups_placeholder"
        />
      ),
    },
  },
];

const YearSelect = props => {
  const { t } = useTranslation();
  const { field, id } = props;

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId={`${id}-label`}
      id={id}
    >
      <MenuItem value="">
        {t('landscape.form_profile_partnership_year_placeholder')}
      </MenuItem>
      {_.range(PARTNERSHIP_START_YEAR, new Date().getFullYear() + 1)
        .reverse()
        .map(year => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
    </Select>
  );
};

const PartnershipStatusInfo = props => {
  return (
    <Stack direction="row" alignItems="center">
      <Subheader
        id="landscape-affiliation-partnershipStatus-info"
        text="landscape.form_profile_partnership_status"
      />
      <HelperText
        i18nKey="landscape.form_profile_partnership_status_helper_text"
        label="landscape.form_profile_partnership_status"
      />
    </Stack>
  );
};

const PartnershipStatusRadioGroup = props => {
  const { t } = useTranslation();
  const { field, id } = props;
  const options = [
    {
      key: 'yes',
      labelKey: 'landscape.profile_profile_card_partnership_status_yes',
    },
    {
      key: 'in-progress',
      labelKey: 'landscape.profile_profile_card_partnership_status_in_progress',
    },
    {
      key: 'no',
      labelKey: 'landscape.profile_profile_card_partnership_status_no',
    },
  ];

  const handleChange = event => {
    field.onChange(event.target.value);
  };

  return (
    <RadioGroup
      id={id}
      row
      aria-labelledby="landscape-affiliation-partnershipStatus-info"
      value={field.value || ''}
      onChange={handleChange}
    >
      {options.map(option => (
        <FormControlLabel
          key={option.key}
          value={option.key}
          control={<Radio />}
          label={t(option.labelKey)}
        />
      ))}
    </RadioGroup>
  );
};

const AffiliationStep = props => {
  const { t } = useTranslation();
  const { setUpdatedLandscape, landscape, isNew, onCancel, onSave } = props;
  const [updatedValues, setUpdatedValues] = useState();

  const title = !isNew
    ? t('landscape.form_affiliation_edit_title', {
        name: _.getOr('', 'name', landscape),
      })
    : t('landscape.form_affiliation_new_title');

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
        {t('landscape.form_affiliation_description')}
      </Typography>
      <Form
        aria-labelledby="main-heading"
        prefix="landscape-affiliation"
        localizationPrefix="landscape.form_affiliation"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        isMultiStep
        onChange={setUpdatedValues}
        filterField={(field, { getValues }) => {
          if (
            !_.includes(field.name, ['partnership.year', 'partnership.group'])
          ) {
            return true;
          }
          const partnershipStatus = getValues('partnershipStatus');
          return _.includes(partnershipStatus, ['in-progress', 'yes']);
        }}
      />
      <Actions
        isForm
        isNew={isNew}
        onCancel={onCancel}
        onSave={onSave}
        updatedValues={updatedValues}
        onNext={setUpdatedLandscape}
        nextLabel={t('landscape.form_add_affiliation_label')}
      />
    </>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <AffiliationStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
