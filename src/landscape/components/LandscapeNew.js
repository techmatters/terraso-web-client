import React, { useCallback, useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import Stepper from 'common/components/Stepper';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { useFetchData } from 'state/utils';

import { fetchGroupsAutocompleteList } from 'group/groupSlice';
import { PARTNERSHIP_STATUS_NO } from 'landscape/landscapeConstants';
import { saveLandscape, setFormNewValues } from 'landscape/landscapeSlice';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LIVELIHOOD,
  TYPE_ORGANIZATION,
} from 'taxonomies/taxonomiesConstants';
import { fetchTermsForTypes } from 'taxonomies/taxonomiesSlice';

import AffiliationStep from './LandscapeForm/AffiliationStep';
import BoundaryStep from './LandscapeForm/BoundaryStep';
import InfoStep from './LandscapeForm/KeyInfoStep';
import ProfileStep from './LandscapeForm/ProfileStep';

const LandscapeNew = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { fetching: fetchingTaxonomyTerms = true } = useSelector(
    _.getOr({}, `taxonomies.terms.${TYPE_ECOSYSTEM_TYPE}`)
  );
  const { fetching: fetchingGroupsList } = useSelector(
    _.get(`group.autocomplete`)
  );

  const { saving, landscape } = useSelector(state => state.landscape.form);
  const [updatedLandscape, setUpdatedLandscape] = useState({
    partnershipStatus: PARTNERSHIP_STATUS_NO,
  });

  useDocumentTitle(t('landscape.form_new_document_title'));

  useEffect(() => {
    dispatch(setFormNewValues());
  }, [dispatch]);

  useEffect(() => {
    setUpdatedLandscape(landscape);
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

  const onUpdate = async updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    return dispatch(saveLandscape(updatedLandscape)).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        navigate(`/landscapes/${landscape.slug}`);
        trackEvent('Landscape created - Optional Steps', {
          props: {
            option: updatedLandscape.boundaryOption,
            country: updatedLandscape.location,
          },
        });
        return;
      }
      return Promise.reject();
    });
  };

  const onCreate = async updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    return dispatch(saveLandscape(updatedLandscape)).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        trackEvent('Landscape created', {
          props: {
            country: updatedLandscape.location,
          },
        });
        return;
      }
      return Promise.reject();
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
            onCreate(updatedLandscape).then(() => {
              setActiveStepIndex(current => current + 1);
            });
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
          onCancel={() => navigate(`/landscapes/${landscape.slug}`)}
          onSkip={() => setActiveStepIndex(current => current + 1)}
          setUpdatedLandscape={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
          }}
          onSave={onUpdate}
          saveLabel={t('landscape.form_add_label')}
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
          onSave={onUpdate}
        />
      ),
    },
    {
      label: t('landscape.form_step_affiliation_label'),
      render: ({ setActiveStepIndex }) => (
        <AffiliationStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={onUpdate}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          onSave={onUpdate}
        />
      ),
    },
  ];

  if (fetchingTaxonomyTerms || fetchingGroupsList) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <Typography variant="h1" sx={visuallyHidden} id="landscape-page-title">
        {t('landscape.form_new_document_title')}
      </Typography>
      <Stepper steps={steps} ariaLabel="landscape-page-title" />
    </PageContainer>
  );
};

export default LandscapeNew;
