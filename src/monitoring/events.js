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

import { useCallback, useMemo } from 'react';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';

export const useShareEvent = () => {
  const { trackEvent } = useAnalytics();
  const pageUrl = useMemo(() => window.location, []);

  const onShare = useCallback(
    method => {
      trackEvent('share', { props: { url: pageUrl.toString(), method } });
    },
    [trackEvent, pageUrl]
  );

  return { onShare };
};

export const useDownloadEvent = () => {
  const { trackEvent } = useAnalytics();

  const onDownload = useCallback(
    (entityType, ownerSlug, location) => {
      trackEvent('dataEntry.file.download', {
        props: {
          [entityType]: ownerSlug,
          downloadLocation: location,
        },
      });
    },
    [trackEvent]
  );

  return { onDownload };
};
