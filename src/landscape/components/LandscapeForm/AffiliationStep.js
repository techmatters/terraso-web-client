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
  Typography,
} from '@mui/material';

import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';

import GroupAutocomplete from 'group/components/GroupAutocomplete';
import TaxonomyAutocomplete from 'taxonomies/components/TaxonomyAutocomplete';
import { TYPE_ORGANIZATION } from 'taxonomies/taxonomiesConstants';

import Actions from './Actions';

const PARTNERSHIP_START_YEAR = 1900;

const VALIDATION_SCHEMA = yup.object().shape({}).required();

const FORM_FIELDS = [
  {
    name: 'partnershipStatus',
    label: 'landscape.form_profile_partnership_status',
    props: {
      renderInput: ({ id, field }) => (
        <PartnershipStatusRadioGroup field={field} />
      ),
    },
  },
  {
    name: 'partnership.year',
    label: 'landscape.form_profile_partnership_year',
    type: 'number',
    props: {
      renderInput: ({ id, field }) => <YearSelect field={field} />,
    },
  },
  {
    name: 'partnership.group',
    label: 'landscape.form_profile_partnership_group',
    props: {
      renderInput: ({ id, field }) => (
        <GroupAutocomplete
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_partnership_group_placeholder"
        />
      ),
    },
  },
  {
    name: 'affiliatedGroups',
    label: 'landscape.form_profile_affiliated_groups',
    props: {
      renderInput: ({ id, field }) => (
        <GroupAutocomplete
          multiple
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_affiliated_groups_placeholder"
        />
      ),
    },
  },
  {
    name: 'taxonomyTypeTerms.organization',
    label: 'landscape.form_profile_organizations',
    props: {
      renderInput: ({ id, field }) => (
        <TaxonomyAutocomplete
          freeSolo
          type={TYPE_ORGANIZATION}
          value={field.value}
          onChange={field.onChange}
          placeholder="landscape.form_profile_organizations_placeholder"
        />
      ),
    },
  },
];

const YearSelect = props => {
  const { t } = useTranslation();
  const { field } = props;

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId="TODO"
      id="year-select"
    >
      <MenuItem value={''}>
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

const PartnershipStatusRadioGroup = props => {
  const { t } = useTranslation();
  const { field } = props;
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
      row
      aria-labelledby="landscape-affiliation-partnershipStatus-label"
      value={field.value}
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
        setUpdatedLandscape={setUpdatedLandscape}
        nextLabel={t('landscape.form_add_label')}
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
