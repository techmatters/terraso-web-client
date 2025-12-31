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

import { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import Stepper from 'terraso-web-client/common/components/Stepper';
import { useDocumentTitle } from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  MAP_LANDSCAPE_BOUNDARIES,
} from 'terraso-web-client/monitoring/ilm';
import { fetchGroupsAutocompleteList } from 'terraso-web-client/group/groupSlice';
import AffiliationStep from 'terraso-web-client/landscape/components/LandscapeForm/AffiliationStep';
import BoundaryStep from 'terraso-web-client/landscape/components/LandscapeForm/BoundaryStep/index';
import InfoStep from 'terraso-web-client/landscape/components/LandscapeForm/KeyInfoStep';
import ProfileStep from 'terraso-web-client/landscape/components/LandscapeForm/ProfileStep';
import {
  saveLandscape,
  setFormNewValues,
} from 'terraso-web-client/landscape/landscapeSlice';
import {
  TYPE_AGRICULTURAL_PRODUCTION_METHOD,
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LIVELIHOOD,
  TYPE_ORGANIZATION,
} from 'terraso-web-client/taxonomies/taxonomiesConstants';
import { fetchTermsForTypes } from 'terraso-web-client/taxonomies/taxonomiesSlice';

const STEP_BOUNDARY = 'boundary';
const STEP_PROFILE = 'profile';
const STEP_AFFILIATION = 'affiliation';

const LandscapeNew = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { fetching: fetchingTaxonomyTerms = true } = useSelector(
    _.getOr({}, `taxonomies.terms`)
  );
  const { fetching: fetchingGroupsList } = useSelector(
    _.get(`group.autocomplete`)
  );

  const { saving, landscape } = useSelector(state => state.landscape.form);
  const [updatedLandscape, setUpdatedLandscape] = useState({});

  useDocumentTitle(t('landscape.form_new_document_title'));

  useEffect(() => {
    dispatch(setFormNewValues());
  }, [dispatch]);

  useEffect(() => {
    if (landscape) {
      setUpdatedLandscape(landscape);
    }
  }, [landscape]);

  useFetchData(
    useCallback(
      () =>
        fetchTermsForTypes({
          types: [
            TYPE_ECOSYSTEM_TYPE,
            TYPE_LIVELIHOOD,
            TYPE_COMMODITY,
            TYPE_ORGANIZATION,
            TYPE_AGRICULTURAL_PRODUCTION_METHOD,
          ],
        }),
      []
    )
  );
  useFetchData(fetchGroupsAutocompleteList);

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch]
  );

  const onUpdate = step => updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    return dispatch(
      saveLandscape({
        successKey: 'landscape.updated',
        landscape: updatedLandscape,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (!success) {
        return Promise.reject();
      }
      navigate(`/landscapes/${landscape.slug}`);
      trackEvent('landscape.create.exit', {
        props: {
          landscapeName: updatedLandscape.name,
          country: updatedLandscape.location,
          lastStep: step,
          boundaryOption: updatedLandscape.boundaryOption,
        },
      });
      if (updatedLandscape.boundaryOption) {
        trackEvent('landscape.boundary.create', {
          props: {
            landscapeName: updatedLandscape.name,
            country: updatedLandscape.location,
            boundaryOption: updatedLandscape.boundaryOption,
            [ILM_OUTPUT_PROP]: MAP_LANDSCAPE_BOUNDARIES,
          },
        });
      }
    });
  };

  const onCreate = (updatedLandscape, setActiveStepIndex) => {
    setUpdatedLandscape(updatedLandscape);
    dispatch(
      saveLandscape({
        successKey: updatedLandscape.id
          ? 'landscape.updated'
          : 'landscape.added',
        landscape: updatedLandscape,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (!success) {
        return;
      }
      if (!updatedLandscape.id) {
        trackEvent('landscape.create', {
          props: {
            landscapeName: updatedLandscape.name,
            country: updatedLandscape.location,
          },
        });
      }
      setActiveStepIndex(current => current + 1);
    });
  };

  const steps = [
    {
      label: t('landscape.form_step_info_label'),
      render: ({ setActiveStepIndex }) => (
        <InfoStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={updatedLandscape => {
            onCreate(updatedLandscape, setActiveStepIndex);
          }}
        />
      ),
    },
    {
      label: t('landscape.form_step_boundaries_options_label'),
      render: ({ setActiveStepIndex }) => (
        <BoundaryStep
          isNew
          title={t('landscape.form_boundary_pin_title')}
          landscape={updatedLandscape}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          onSkip={() => setActiveStepIndex(current => current + 1)}
          setUpdatedLandscape={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
          }}
          onSave={onUpdate(STEP_BOUNDARY)}
          saveLabel={t('landscape.form_next')}
        />
      ),
    },
    {
      label: t('landscape.form_step_profile_label'),
      render: ({ setActiveStepIndex }) => (
        <ProfileStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
          }}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          onSave={onUpdate(STEP_PROFILE)}
        />
      ),
    },
    {
      label: t('landscape.form_step_affiliation_label'),
      render: ({ setActiveStepIndex }) => (
        <AffiliationStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={onUpdate(STEP_AFFILIATION)}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          onSave={onUpdate(STEP_AFFILIATION)}
        />
      ),
    },
  ];

  if (fetchingTaxonomyTerms || fetchingGroupsList) {
    return <PageLoader />;
  }

  return (
    <PageContainer sx={{ paddingTop: 4 }}>
      {saving && <PageLoader />}
      <Typography variant="h1" sx={visuallyHidden} id="landscape-page-title">
        {t('landscape.form_new_document_title')}
      </Typography>
      <Stepper
        steps={steps}
        listProps={{
          'aria-labelledby': 'landscape-page-title',
        }}
      />
    </PageContainer>
  );
};

export default LandscapeNew;
