import React, { useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Button, Card, CardContent, Grid, Typography } from '@mui/material';

import { countryNameForCode } from 'common/utils';
import Restricted from 'permissions/components/Restricted';

import { getTermLabel } from 'taxonomies/taxonomiesUtils';

const FIELDS = [
  {
    label: 'landscape.profile_profile_card_location_label',
    customValue: landscape => countryNameForCode(landscape.location)?.name,
  },
  {
    label: 'landscape.profile_profile_card_area_types_label',
    customValue: (landscape, { t }) =>
      _.isEmpty(landscape.areaTypes)
        ? null
        : landscape.areaTypes
            .map(areaType =>
              t(`landscape.profile_profile_card_area_types_${areaType}`)
            )
            .join(', '),
  },
  {
    label: 'landscape.profile_profile_card_ecosystem_types_label',
    customValue: (landscape, { i18n }) =>
      getTermsList('ecosystem-type', landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_languages_label',
    customValue: (landscape, { i18n }) =>
      getTermsList('language', landscape, i18n),
  },
  {
    path: 'population',
    label: 'landscape.profile_profile_card_population_label',
  },
  {
    label: 'landscape.profile_profile_card_livelihoods_label',
    customValue: (landscape, { i18n }) =>
      getTermsList('livelihood', landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_commodities_label',
    customValue: (landscape, { i18n }) =>
      getTermsList('commodity', landscape, i18n),
  },
];

const getTermsList = (type, landscape, i18n) =>
  _.isEmpty(landscape?.taxonomyTerms[type])
    ? null
    : landscape?.taxonomyTerms[type]
        .map(term => getTermLabel(term, i18n.resolvedLanguage))
        .join(', ');

const ProfileField = props => {
  const translation = useTranslation();
  const { path, label, landscape, customValue } = props;

  const value = useMemo(
    () => (customValue ? customValue(landscape, translation) : landscape[path]),
    [customValue, landscape, path, translation]
  );

  if (!value) {
    return null;
  }

  return (
    <>
      <Grid
        item
        sx={{ textTransform: 'uppercase' }}
        xs={5}
        component={Typography}
        variant="caption"
      >
        {label}
      </Grid>
      <Grid item xs={7}>
        {value}
      </Grid>
    </>
  );
};

const ProfileCard = props => {
  const { t } = useTranslation();
  const { landscape } = props;

  return (
    <Card
      component="section"
      aria-label={t('landscape.profile_profile_card_label')}
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <CardContent sx={{ display: 'flex', flexGrow: 1 }}>
        <Grid container spacing={2} sx={{ pt: 2, pl: 2, pr: 2 }}>
          {FIELDS.map((field, index) => (
            <ProfileField
              key={index}
              path={field.path}
              label={t(field.label)}
              customValue={field.customValue}
              landscape={landscape}
            />
          ))}
        </Grid>
      </CardContent>
      <CardContent>
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/profile/edit`}
          >
            {t('landscape.profile_profile_card_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
