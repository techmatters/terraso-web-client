import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Stepper from 'common/components/Stepper';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import { saveLandscape, setFormNewValues } from 'landscape/landscapeSlice';

import BoundaryStep from './LandscapeForm/BoundaryStep';
import InfoStep from './LandscapeForm/InfoStep';

const LandscapeNew = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { saving, landscape, success } = useSelector(
    state => state.landscape.form
  );
  const [updatedLandscape, setUpdatedLandscape] = useState();

  useDocumentTitle(t('landscape.form_new_document_title'));

  useEffect(() => {
    dispatch(setFormNewValues());
  }, [dispatch]);

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
          landscape={updatedLandscape}
          setActiveStepIndex={setActiveStepIndex}
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
          setActiveStepIndex={setActiveStepIndex}
          setUpdatedLandscape={setUpdatedLandscape}
          onCancel={() => setActiveStepIndex(current => current - 1)}
          save={onSave}
          saveLabel={t('landscape.form_add_label')}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <Stepper steps={steps} />
    </PageContainer>
  );
};

export default LandscapeNew;
