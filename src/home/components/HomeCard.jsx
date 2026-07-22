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

import { Box, Card, Stack, Typography } from '@mui/material';

import HelperText from 'terraso-web-client/common/components/HelperText';
import RouterButton from 'terraso-web-client/common/components/RouterButton';

const InlineAction = ({ action }) => {
  if (!action) {
    return null;
  }

  return (
    <Box
      sx={{
        pt: 4,
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <RouterButton
        variant="contained"
        size="medium"
        sx={{ color: 'white' }}
        to={action.to}
        state={action.pathState}
      >
        {action.label}
      </RouterButton>
    </Box>
  );
};

const HomeCard = ({ title, action, children, helperText, titleId }) => {
  return (
    <Card
      component="section"
      aria-labelledby={titleId}
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="column" sx={{ p: 4 }}>
        <Stack direction="row">
          <Typography
            id={titleId}
            variant="h2"
            sx={{ pt: 0, pb: 2, textTransform: 'uppercase' }}
          >
            {title}
          </Typography>
          {helperText && (
            <Box sx={{ alignItems: 'center' }}>
              <HelperText i18nKey={helperText} />
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2}>
          {children}
        </Stack>
        <InlineAction action={action} />
      </Stack>
    </Card>
  );
};

export default HomeCard;
