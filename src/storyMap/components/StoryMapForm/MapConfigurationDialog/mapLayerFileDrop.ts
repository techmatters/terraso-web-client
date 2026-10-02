/*
 * Copyright © 2025 Technology Matters
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

import {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  SHARED_DATA_MAX_SIZE,
} from 'terraso-web-client/config';

/**
 * Whether a file is accepted by the map layer create flow (same accepted
 * types/extensions and max size as the create flow's drop zone).
 */
export const isMapLayerFileAccepted = (file: File): boolean => {
  const name = file.name?.toLowerCase() ?? '';
  const extension = name.includes('.')
    ? name.slice(name.lastIndexOf('.') + 1)
    : '';
  const extensionOk = MAP_LAYER_ACCEPTED_EXTENSIONS.includes(extension);
  const typeOk = Object.keys(MAP_LAYER_ACCEPTED_TYPES).includes(file.type);
  return (extensionOk || typeOk) && file.size <= SHARED_DATA_MAX_SIZE;
};
