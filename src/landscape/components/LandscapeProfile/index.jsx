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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Grid, Stack } from '@mui/material';

import { useSocialShareContext } from 'terraso-web-client/common/components/SocialShare';
import {
  useDocumentDescription,
  useDocumentImage,
  useDocumentTitle,
} from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageHeader from 'terraso-web-client/layout/PageHeader';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import { usePermission } from 'terraso-web-client/permissions/index';
import AffiliationCard from 'terraso-web-client/landscape/components/LandscapeProfile/AffiliationCard';
import DevelopmentStrategyCard from 'terraso-web-client/landscape/components/LandscapeProfile/DevelopmentStrategyCard';
import KeyInfoCard from 'terraso-web-client/landscape/components/LandscapeProfile/KeyInfoCard';
import ProfileCard from 'terraso-web-client/landscape/components/LandscapeProfile/ProfileCard';
import { fetchLandscapeProfile } from 'terraso-web-client/landscape/landscapeSlice';

const LandscapeProfile = () => {
  const { t } = useTranslation();
  const { landscape, fetching } = useSelector(state => state.landscape.profile);
  const { slug } = useParams();
  const { loading: loadingPermissions, allowed } = usePermission(
    'landscape.change',
    landscape
  );

  const [isEmptySections, setIsEmptySections] = useState({
    developmentStrategy: false,
    affiliation: false,
    profile: false,
  });

  const setSectionIsEmpty = useCallback((section, hasData) => {
    setIsEmptySections(current => ({
      ...current,
      [section]: hasData,
    }));
  }, []);

  useDocumentImage(_.get('profileImage', landscape), fetching);

  useDocumentTitle(
    t('landscape.profile_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useDocumentDescription(
    t('landscape.profile_document_description', {
      description: _.get('description', landscape),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  useSocialShareContext(
    useMemo(
      () => ({
        name: landscape?.name,
      }),
      [landscape?.name]
    )
  );

  useFetchData(useCallback(() => fetchLandscapeProfile(slug), [slug]));

  if (fetching || loadingPermissions) {
    return <PageLoader />;
  }

  if (!landscape) {
    return null;
  }

  return (
    <PageContainer>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{
          marginBottom: 1,
        }}
      >
        <PageHeader
          header={landscape.name}
          typographyProps={{ sx: { marginBottom: 0 } }}
        />
      </Stack>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={4} direction="column">
            <KeyInfoCard landscape={landscape} />
            {(!isEmptySections.affiliation || allowed) && (
              <AffiliationCard
                landscape={landscape}
                setIsEmpty={setSectionIsEmpty}
              />
            )}
          </Stack>
        </Grid>
        {(!isEmptySections.profile || allowed) && (
          <Grid
            size={{ xs: 12, md: 6 }}
            style={{ display: 'flex', alignItems: 'flex-start' }}
          >
            <ProfileCard landscape={landscape} setIsEmpty={setSectionIsEmpty} />
          </Grid>
        )}
        {(!isEmptySections.developmentStrategy || allowed) && (
          <Grid size={{ xs: 12, md: 12 }}>
            <DevelopmentStrategyCard
              landscape={landscape}
              setIsEmpty={setSectionIsEmpty}
            />
          </Grid>
        )}
      </Grid>
    </PageContainer>
  );
};

export default LandscapeProfile;
