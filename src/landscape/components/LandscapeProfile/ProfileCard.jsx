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

import { useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmButton from 'terraso-web-client/common/components/ConfirmButton';
import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { countryNameForCode } from 'terraso-web-client/common/countries';
import Restricted from 'terraso-web-client/permissions/components/Restricted';
import { usePermission } from 'terraso-web-client/permissions/index';
import { deleteProfileImage } from 'terraso-web-client/landscape/landscapeSlice';
import {
  TYPE_AGRICULTURAL_PRODUCTION_METHOD,
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LANGUAGE,
  TYPE_LIVELIHOOD,
} from 'terraso-web-client/taxonomies/taxonomiesConstants';
import { getTermLabel } from 'terraso-web-client/taxonomies/taxonomiesUtils';

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
      getTermsList(TYPE_ECOSYSTEM_TYPE, landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_languages_label',
    getCount: landscape => getTermsCount(TYPE_LANGUAGE, landscape),
    getValue: (landscape, { i18n }) =>
      getTermsList(TYPE_LANGUAGE, landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_population_label',
    getValue: landscape => landscape.population?.toLocaleString(),
  },
  {
    label: 'landscape.profile_profile_card_landscape_size_label',
    getValue: landscape =>
      landscape.areaScalarHa
        ? landscape.areaScalarHa.toLocaleString() + ' ha'
        : null,
  },
  {
    label: 'landscape.profile_profile_card_livelihoods_label',
    getValue: (landscape, { i18n }) =>
      getTermsList(TYPE_LIVELIHOOD, landscape, i18n),
  },
  {
    label:
      'landscape.profile_profile_card_agricultural_production_methods_label',
    getValue: (landscape, { i18n }) =>
      getTermsList(TYPE_AGRICULTURAL_PRODUCTION_METHOD, landscape, i18n),
  },
  {
    label: 'landscape.profile_profile_card_commodities_label',
    getValue: (landscape, { i18n }) =>
      getTermsList(TYPE_COMMODITY, landscape, i18n),
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
        sx={{ textTransform: 'uppercase' }}
        size={{ xs: 5 }}
        component={Typography}
        variant="caption"
      >
        {label}
      </Grid>
      <Grid size={{ xs: 7 }} component={Typography}>
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

  const processing = useSelector(
    _.get('landscape.profile.deletingProfileImage')
  );
  const dispatch = useDispatch();

  if (!allowed && !hasProfileImage) {
    return null;
  }

  const confirmProfileImageDelete = () => {
    return dispatch(
      deleteProfileImage({
        successKey: 'landscape.profile_image_deleted',
        landscape: {
          id: landscape.id,
          profileImage: '',
          profileImageDescription: '',
        },
      })
    );
  };

  return (
    <figure style={{ margin: 0 }}>
      <Stack
        sx={{
          position: 'relative',
        }}
      >
        <img
          src={hasProfileImage ? landscape.profileImage : PROFILE_IMAGE_DEFAULT}
          alt=""
          style={{ width: '100%' }}
        />
        {allowed && (
          <Box
            sx={{
              color: 'white',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: hasProfileImage ? 'row' : 'column',
              position: 'absolute',
              bottom: 0,
              width: '100%',
              pt: hasProfileImage ? 2 : 1,
              pb: hasProfileImage ? 2 : 4,
              paddingLeft: hasProfileImage ? '32px' : '0',
            }}
            spacing={2}
          >
            {!hasProfileImage && (
              <Restricted permission="landscape.change" resource={landscape}>
                <Typography
                  sx={{
                    p: 2,
                    fontWeight: 'bold',
                  }}
                >
                  {t(
                    'landscape.profile_profile_card_profile_image_placeholder_message'
                  )}
                </Typography>
              </Restricted>
            )}
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/landscapes/${landscape.slug}/profile-image/edit`}
              sx={({ palette }) => ({
                backgroundColor: 'white',
              })}
            >
              {t('landscape.profile_profile_card_profile_image_update')}
            </Button>
            {hasProfileImage && (
              <Box
                sx={{
                  paddingLeft: '5px',
                }}
              >
                <Restricted permission="landscape.change" resource={landscape}>
                  <ConfirmButton
                    onConfirm={confirmProfileImageDelete}
                    loading={processing}
                    variant="text"
                    buttonProps={{
                      title: t('landscape.profile_image_delete_label'),
                    }}
                    confirmTitle={t(
                      'landscape.profile_image_delete_confirm_title'
                    )}
                    confirmMessage={t(
                      'landscape.profile_image_delete_confirm_message'
                    )}
                    confirmButton={t(
                      'landscape.profile_image_delete_confirm_button'
                    )}
                  >
                    <DeleteIcon sx={{ color: 'white' }} />
                  </ConfirmButton>
                </Restricted>
              </Box>
            )}
          </Box>
        )}
      </Stack>
      {hasProfileImage && landscape.profileImageDescription && (
        <Typography component="figcaption" sx={{ background: 'white', p: 2 }}>
          {landscape.profileImageDescription}
        </Typography>
      )}
    </figure>
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
          <Grid
            container
            spacing={2}
            sx={{ pt: 2, pl: 0, pr: 2 }}
            alignItems="center"
          >
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
