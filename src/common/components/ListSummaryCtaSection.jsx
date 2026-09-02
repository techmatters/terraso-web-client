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

import { Link as RouterLink } from 'react-router';
import { Button, Card, Grid, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const ListSummaryCtaSection = ({
  summaryCard,
  ctaDescription,
  ctaButtonLabel,
  ctaButtonTo,
}) => {
  const hasSummaryCard = Boolean(summaryCard);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {hasSummaryCard && <Grid size={{ xs: 12, md: 8 }}>{summaryCard}</Grid>}
      <Grid size={{ xs: 12, md: hasSummaryCard ? 4 : 12 }}>
        <Card
          sx={theme => ({
            alignItems: 'center',
            bgcolor: alpha(theme.palette.black, 0.05),
            border: 'none',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
          })}
        >
          <Typography sx={{ mb: 2 }}>{ctaDescription}</Typography>

          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to={ctaButtonTo}
          >
            {ctaButtonLabel}
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ListSummaryCtaSection;
