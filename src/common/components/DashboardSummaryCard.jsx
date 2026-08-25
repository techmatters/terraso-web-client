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

import HomeCard from 'terraso-web-client/common/components/HomeCard';

const DASHBOARD_SUMMARY_CONTAINER_RADIUS = '16px';
export const DASHBOARD_SUMMARY_ITEM_RADIUS = '8px';

const DASHBOARD_SUMMARY_CARD_SX = {
  bgcolor: 'secondary.main',
  borderRadius: DASHBOARD_SUMMARY_CONTAINER_RADIUS,
  color: 'white',
};

const DASHBOARD_SUMMARY_CONTENT_SX = {
  p: 3,
};

const DASHBOARD_SUMMARY_HEADING_SX = {
  fontSize: 30,
  fontWeight: 700,
  lineHeight: '36px',
  pb: 5,
  textTransform: 'none',
};

const DashboardSummaryCard = ({
  action,
  children,
  helperText,
  title,
  titleId,
}) => (
  <HomeCard
    title={title}
    titleId={titleId}
    action={action}
    helperText={helperText}
    cardSx={DASHBOARD_SUMMARY_CARD_SX}
    contentSx={DASHBOARD_SUMMARY_CONTENT_SX}
    headingSx={DASHBOARD_SUMMARY_HEADING_SX}
  >
    {children}
  </HomeCard>
);

export default DashboardSummaryCard;
