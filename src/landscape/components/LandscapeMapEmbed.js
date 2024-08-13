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
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Typography } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import { useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { fetchLandscapes } from 'landscape/landscapeSlice';

import LandscapeListMap from './LandscapeListMap';

const LandscapeDescriptionPopup = ({ landscape }) => {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h2">{landscape.data.name}</Typography>
      <Typography variant="body2">{landscape.data.description}</Typography>
      <Typography variant="body2">
        <ExternalLink href={`/landscapes/${landscape.data.slug}/profile`}>
          {t('landscape.map_profile_link_text', { name: landscape.data.name })}
        </ExternalLink>
      </Typography>
    </>
  );
};

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
