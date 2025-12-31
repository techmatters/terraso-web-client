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

import { useTranslation } from 'react-i18next';
import { Box, Card, Skeleton } from '@mui/material';

const LoaderCard = () => {
  const { t } = useTranslation();
  return (
    <Card
      role="progressbar"
      aria-label={t('common.loader_label')}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
      }}
    >
      <Box sx={{ display: 'flex', marginBottom: 2 }}>
        <Skeleton
          sx={{ height: 80, width: 80 }}
          animation="wave"
          variant="rectangular"
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 2,
          }}
        >
          <Skeleton animation="wave" height={30} width="150px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="250px" />
          <Skeleton animation="wave" height={10} width="150px" />
        </Box>
      </Box>
      <Skeleton sx={{ height: 40 }} animation="wave" variant="rectangular" />
    </Card>
  );
};

export default LoaderCard;
