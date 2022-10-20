import React, { useCallback, useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';
import { fetchTermsForTypes } from 'taxonomies/taxonomiesSlice';

import { Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import Stepper from 'common/components/Stepper';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { saveLandscape, setFormNewValues } from 'landscape/landscapeSlice';

import AffiliationStep from './LandscapeForm/AffiliationStep';
import BoundaryStep from './LandscapeForm/BoundaryStep';
import InfoStep from './LandscapeForm/KeyInfoStep';
import ProfileStep from './LandscapeForm/ProfileStep';

const LandscapeNew = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fetching = true } = useSelector(
    _.getOr({}, `taxonomies.terms.${TYPE_ECOSYSTEM_TYPE}`)
  );

  const { saving, landscape, success } = useSelector(
    state => state.landscape.form
  );
  const [updatedLandscape, setUpdatedLandscape] = useState();

  useDocumentTitle(t('landscape.form_new_document_title'));

  useEffect(() => {
    dispatch(setFormNewValues());
  }, [dispatch]);

  useFetchData(
    useCallback(
      () =>
        fetchTermsForTypes({
          types: [TYPE_ECOSYSTEM_TYPE, TYPE_LIVELIHOOD, TYPE_COMMODITY],
        }),
      []
    )
  );

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch]
  );

  useEffect(() => {
    if (success) {
      navigate(`/landscapes/${landscape.slug}`);
    }
  }, [success, landscape, navigate, dispatch]);

  const onSave = updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    dispatch(saveLandscape(updatedLandscape));
  };

  const steps = [
    {
      label: t('landscape.form_step_info_label'),
      render: ({ setActiveStepIndex }) => (
        <InfoStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
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
          onSave={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
          }}
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
          onSave={onSave}
        />
      ),
    },
    {
      label: t('landscape.form_step_affiliation_label'),
      render: ({ setActiveStepIndex }) => (
        <AffiliationStep
          isNew
          landscape={updatedLandscape}
          setUpdatedLandscape={updatedLandscape => {
            setUpdatedLandscape(updatedLandscape);
            setActiveStepIndex(current => current + 1);
          }}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          onSave={onSave}
        />
      ),
    },
  ];

  if (fetching) {
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
