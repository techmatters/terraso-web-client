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

const ListSummaryCtaSection = ({
  summaryCard,
  ctaTitle,
  ctaDescription,
  ctaButtonLabel,
  ctaButtonTo,
}) => {
  const hasSummaryCard = Boolean(summaryCard);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {hasSummaryCard && <Grid size={{ xs: 12, md: 6 }}>{summaryCard}</Grid>}
      <Grid size={{ xs: 12, md: hasSummaryCard ? 6 : 12 }}>
        <Card sx={{ p: 2 }}>
          <Typography sx={{ pt: 0 }} variant="h2">
            {ctaTitle}
          </Typography>

          <Typography sx={{ mt: 2, mb: 2 }}>{ctaDescription}</Typography>

          <Button variant="contained" component={RouterLink} to={ctaButtonTo}>
            {ctaButtonLabel}
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ListSummaryCtaSection;
