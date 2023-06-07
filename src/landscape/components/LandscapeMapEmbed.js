/*
 * Copyright © 2023 Technology Matters
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
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popup } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terrasoApi/shared/store/utils';
import { Typography } from '@mui/material';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { fetchLandscapes } from 'landscape/landscapeSlice';
import LandscapeListMap from './LandscapeListMap';

const LandscapeDescriptionPopup = ({ landscape }) => (
  <Popup className="landscape-marker-popup">
    <Typography variant="h2">{landscape.data.name}</Typography>
    <Typography variant="body2">{landscape.data.description}</Typography>
  </Popup>
);

const LandscapeMapEmbed = () => {
  const { t } = useTranslation();
  const { fetching } = useSelector(state => state.landscape.list);

  useDocumentTitle(t('landscape.list_document_title'));

  useFetchData(fetchLandscapes);

  if (fetching) {
    return <PageLoader />;
  }

  return <LandscapeListMap PopupComponent={LandscapeDescriptionPopup} />;
};

export default LandscapeMapEmbed;
