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

import React, { useCallback } from 'react';
import { Link } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';

// Link for external resources. It handles opening it on a new
// tab and tracking the analytics event.
// This is neede because of this plausible issue:
// https://github.com/plausible/plausible-tracker/issues/12
const ExternalLink = ({
  href,
  component,
  children,
  linkProps,
  customTrackEvent,
  underlined = false,
}) => {
  const { trackEvent } = useAnalytics();

  const onClick = useCallback(
    event => {
      const analyticsProps = {
        url: href,
        ...(customTrackEvent?.props || {}),
      };
      window.open(href, '_blank', 'noopener,noreferrer');
      trackEvent(customTrackEvent?.name || 'link.click', {
        props: analyticsProps,
      });
      event.preventDefault();
      event.stopPropagation();
    },
    [href, trackEvent, customTrackEvent]
  );

  return (
    <Link
      href={href}
      component={component}
      onClick={onClick}
      {...(linkProps || {})}
      sx={{
        ...(underlined && { textDecoration: 'underline' }),
      }}
    >
      {children}
    </Link>
  );
};

export default ExternalLink;
