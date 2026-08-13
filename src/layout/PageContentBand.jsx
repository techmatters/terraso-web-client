/*
 * Copyright © 2026 Technology Matters
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

import { Box } from '@mui/material';

import PageContainer from 'terraso-web-client/layout/PageContainer';

const PageContentBand = ({ children }) => (
  <Box
    component="section"
    sx={theme => ({ bgcolor: theme.pageContentBand.background, pt: 2, pb: 6 })}
  >
    <PageContainer sx={{ py: 0 }}>{children}</PageContainer>
  </Box>
);

export default PageContentBand;
