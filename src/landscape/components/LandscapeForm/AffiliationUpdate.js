import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { fetchGroupsAutocompleteList } from 'group/groupSlice';
import AffiliationStep from 'landscape/components/LandscapeForm/AffiliationStep';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';
import { TYPE_ORGANIZATION } from 'taxonomies/taxonomiesConstants';
import { fetchTermsForTypes } from 'taxonomies/taxonomiesSlice';

const AffiliationUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, saving, landscape } = useSelector(
    state => state.landscape.form
  );
  const { fetching: fetchingTaxonomies = true } = useSelector(
    _.getOr({}, `taxonomies.terms.${TYPE_ORGANIZATION}`)
  );
  const { fetching: fetchingGroupsList } = useSelector(
    _.get(`group.autocomplete`)
  );

  const onSave = updatedLandscape => {
    dispatch(saveLandscape(updatedLandscape)).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        navigate(`/landscapes/${landscape.slug}/profile`);
      }
    });
  };

  useDocumentTitle(
    t('landscape.form_edit_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useEffect(() => () => dispatch(setFormNewValues()), [dispatch]);

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));
  useFetchData(
    useCallback(
      () =>
        fetchTermsForTypes({
          types: [TYPE_ORGANIZATION],
        }),
      []
    )
  );
  useFetchData(fetchGroupsAutocompleteList);

  if (fetching || fetchingTaxonomies || fetchingGroupsList) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <AffiliationStep
        landscape={landscape}
        onSave={updatedLandscape => {
          onSave(updatedLandscape);
        }}
        onCancel={() => navigate(`/landscapes/${landscape.slug}/profile`)}
      />
    </PageContainer>
  );
};

export default AffiliationUpdate;
