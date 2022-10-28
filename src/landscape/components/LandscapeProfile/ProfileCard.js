import React, { useEffect, useMemo } from 'react';

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
    getValue: landscape => countryNameForCode(landscape.location)?.name,
  },
  {
    label: 'landscape.profile_profile_card_area_types_label',
    getValue: (landscape, { t }) =>
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
    getValue: (landscape, { i18n }) =>
      getTermsList('ecosystem-type', landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_languages_label',
    getCount: landscape => getTermsCount('language', landscape),
    getValue: (landscape, { i18n }) =>
      getTermsList('language', landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_population_label',
    getValue: landscape => landscape.population,
  },
  {
    label: 'landscape.profile_profile_card_livelihoods_label',
    getValue: (landscape, { i18n }) =>
      getTermsList('livelihood', landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_commodities_label',
    getValue: (landscape, { i18n }) =>
      getTermsList('commodity', landscape, i18n),
  },
];

const getTermsCount = (type, landscape) =>
  _.isEmpty(landscape?.taxonomyTerms[type])
    ? null
    : landscape?.taxonomyTerms[type].length;

const getTermsList = (type, landscape, i18n) =>
  _.isEmpty(landscape?.taxonomyTerms[type])
    ? null
    : landscape?.taxonomyTerms[type]
        .map(term => getTermLabel(term, i18n.resolvedLanguage))
        .join(', ');

const ProfileField = props => {
  const { label, value } = props;

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
  const { t, i18n } = useTranslation();
  const { landscape, setIsEmpty } = props;

  const values = useMemo(
    () =>
      _.fromPairs(
        FIELDS.map((field, index) => [
          index,
          field.getValue(landscape, { t, i18n }),
        ]).filter(([index, value]) => !!value)
      ),
    [landscape, t, i18n]
  );

  const counts = useMemo(
    () =>
      _.fromPairs(
        FIELDS.map((field, index) => [
          index,
          field.getCount ? field.getCount(landscape, { t }) : 1,
        ]).filter(([index, value]) => !!value)
      ),
    [landscape, t]
  );

  useEffect(() => {
    setIsEmpty('profile', _.isEmpty(values));
  }, [setIsEmpty, values]);

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
      {_.isEmpty(values) && (
        <CardContent sx={{ mt: 2 }}>
          {t('landscape.profile_profile_card_empty')}
        </CardContent>
      )}
      <CardContent sx={{ display: 'flex', flexGrow: 1 }}>
        <Grid container spacing={2} sx={{ pt: 2, pl: 0, pr: 2 }}>
          {FIELDS.map((field, index) => (
            <ProfileField
              key={index}
              label={t(field.label, { count: counts[index] })}
              value={values[index]}
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
