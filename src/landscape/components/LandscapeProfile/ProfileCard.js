import React, { useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { countryNameForCode } from 'common/utils';
import Restricted from 'permissions/components/Restricted';

import { getTermLabel } from 'taxonomies/taxonomiesUtils';

const PROFILE_IMAGE_DEFAULT = '/landscape/profile-image-default.jpg';

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

const ProfileImage = props => {
  const { t } = useTranslation();
  const { landscape } = props;
  const { allowed } = usePermission('landscape.change', landscape);

  const hasProfileImage = !!landscape.profileImage;

  if (!allowed && !hasProfileImage) {
    return null;
  }

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      {allowed && (
        <Stack sx={{ position: 'absolute', mb: 2, color: 'white' }} spacing={2}>
          {!hasProfileImage && (
            <Typography>
              {t(
                'landscape.profile_profile_card_profile_image_placeholder_message'
              )}
            </Typography>
          )}
          <Button
            variant="contained"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/profile-image/edit`}
            sx={{
              backgroundColor: 'white',
              color: 'black',
            }}
          >
            {t('landscape.profile_profile_card_profile_image_update')}
          </Button>
        </Stack>
      )}
      <img
        src={hasProfileImage ? landscape.profileImage : PROFILE_IMAGE_DEFAULT}
        alt={
          landscape.profileImageDescription ||
          t('landscape.profile_profile_card_profile_image_alt', {
            name: landscape.name,
          })
        }
        style={{ width: '100%' }}
      />
    </Box>
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
      aria-label={t('landscape.profile_profile_card_label', {
        name: landscape.name,
      })}
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <ProfileImage landscape={landscape} />
      {_.isEmpty(values) ? (
        <>
          <CardContent sx={{ mt: 2 }}>
            {t('landscape.profile_profile_card_empty')}
          </CardContent>
          <Restricted permission="landscape.change" resource={landscape}>
            <CardContent sx={{ mt: 2 }}>
              {t('landscape.profile_profile_card_enter')}
            </CardContent>
          </Restricted>
        </>
      ) : (
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
      )}
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
