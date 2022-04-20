import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import PageContainer from 'layout/PageContainer';
import Stepper from 'common/components/Stepper';

import InfoStep from './InfoStep';
import BoundaryStep from './BoundaryStep';

const LandscapeForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { slug } = useParams();
  const { fetching, landscape } = useSelector(state => state.landscape.form);
  const [updatedLandscape, setUpdatedLandscape] = React.useState(landscape);

  const isNew = !slug;

  useDocumentTitle(
    !isNew
      ? t('landscape.form_edit_document_title', {
          name: _.getOr('', 'name', landscape),
        })
      : t('landscape.form_new_document_title'),
    fetching
  );

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues());
      return;
    }
    dispatch(fetchLandscapeForm(slug));
  }, [dispatch, slug, isNew]);

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch, slug, isNew]
  );

  useEffect(() => {
    if (landscape && landscape.slug !== slug) {
      // Change URL if new landscape ID
      navigate(`/landscapes/${landscape.slug}`);
    }
  }, [slug, landscape, navigate]);

  const onSave = updatedLandscape => {
    setUpdatedLandscape(updatedLandscape);
    dispatch(saveLandscape(updatedLandscape));
  };

  const renderStep =
    Component =>
    ({ setActiveStepIndex }) =>
      (
        <Component
          landscape={updatedLandscape}
          setActiveStepIndex={setActiveStepIndex}
          setUpdatedLandscape={setUpdatedLandscape}
          save={onSave}
        />
      );

  const steps = [
    {
      label: t('landscape.form_step_info_label'),
      render: renderStep(InfoStep),
    },
    {
      label: t('landscape.form_step_boundaries_options_label'),
      render: renderStep(BoundaryStep),
    },
  ];

  return (
    <PageContainer>
      {fetching && <PageLoader />}
      <Stepper steps={steps} />
    </PageContainer>
  );
};

export default LandscapeForm;
