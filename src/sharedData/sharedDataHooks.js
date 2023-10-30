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
import { useCallback } from 'react';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import { useAnalytics } from 'monitoring/analytics';

export const useSharedData = () => {
  const { trackEvent } = useAnalytics();
  const { owner, entityType } = useCollaborationContext();

  const downloadFile = useCallback(
    file => {
      trackEvent('dataEntry.file.download', {
        props: { [entityType]: owner.slug },
      });
      window.open(file.url, '_blank');
    },
    [trackEvent, owner, entityType]
  );

  return { downloadFile };
};
