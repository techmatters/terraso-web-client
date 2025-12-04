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

import React, { useCallback, useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, MAP_LANDSCAPE_BOUNDARIES } from 'monitoring/ilm';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

import BoundaryStep from './BoundaryStep';

const LandscapeBoundariesUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { slug } = useParams();
  const { fetching, saving, landscape, success } = useSelector(
    state => state.landscape.form
  );

  useDocumentTitle(
    t('landscape.boundaries_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));

  useEffect(() => {
    if (success) {
      navigate(`/landscapes/${slug}`);
    }
    return () => dispatch(setFormNewValues());
  }, [success, slug, navigate, dispatch]);

  if (fetching || !landscape) {
    return <PageLoader />;
  }

  const onSave = async updatedLandscape => {
    return dispatch(
      saveLandscape({
        successKey: 'landscape.boundary_success',
        landscape: {
          id: landscape.id,
          areaPolygon: updatedLandscape.areaPolygon,
        },
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        trackEvent('landscape.boundary.edit', {
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

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <BoundaryStep
        title={t('landscape.boundaries_title', {
          name: _.get('name', landscape),
        })}
        landscape={landscape}
        onSkip={onSave}
        onSave={onSave}
        saveLabel={t('landscape.boundaries_update_save')}
        onCancel={() => navigate(`/landscapes/${slug}`)}
      />
    </PageContainer>
  );
};

export default LandscapeBoundariesUpdate;
