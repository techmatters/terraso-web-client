/*
 * Copyright © 2023 Technology Matters
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
import _ from 'lodash/fp';

export const extractDataEntry = dataEntry => ({
  ...dataEntry,
  visualizations: dataEntry?.visualizations?.edges?.map(edge => edge.node),
});

// TODO remove
export const extractDataEntries = parent =>
  parent.sharedResources?.edges
    .map(edge => edge.node.source)
    .map(dataEntry => extractDataEntry(dataEntry));

export const extractSharedResources = parent =>
  parent.sharedResources?.edges.map(edge => ({
    ..._.omit('source', edge.node),
    dataEntry: extractDataEntry(edge.node.source),
  }));
