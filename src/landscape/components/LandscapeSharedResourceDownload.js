/*
 * Copyright © 2024 Technology Matters
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
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Button, Paper, Stack, Typography } from '@mui/material';

import PageContainer from 'layout/PageContainer';
import { fetchSharedResource } from 'sharedData/sharedDataSlice';

const LandscapeSharedResourceDownload = () => {
  const { shareUuid } = useParams();

  useFetchData(
    useCallback(() => fetchSharedResource({ shareUuid }), [shareUuid])
  );

  return (
    <PageContainer maxWidth="sm">
      <Stack
        alignItems="center"
        component={Paper}
        variant="outlined"
        spacing={2}
        sx={{ p: 4 }}
      >
        <Typography variant="h1">Title</Typography>
        <Typography>Title</Typography>
        <Button variant="contained">Doanload</Button>
      </Stack>
    </PageContainer>
  );
};

export default LandscapeSharedResourceDownload;
