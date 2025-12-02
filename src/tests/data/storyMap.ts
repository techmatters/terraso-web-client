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

import { LngLat, LngLatBounds } from 'mapbox-gl';
import {
  DataEntryNode,
  StoryMapNode,
  VisualizationConfigNode,
} from 'terrasoApi/shared/graphqlSchema/graphql';

import { MapPosition, StoryMapConfig } from 'storyMap/storyMapTypes';

import { createTestGraphQLConnection } from './graphql';
import { createTestUser } from './user';

export const createTestPosition = (): MapPosition => ({
  center: new LngLat(1, 1),
  zoom: 10,
  pitch: 0,
  bearing: 0,
  bounds: new LngLatBounds([-1, -1], [1, 1]),
});

export const createTestStoryMapConfig = (): StoryMapConfig => ({
  style: 'mapbox://styles/mapbox/streets-v12',
  projection: 'mercator',
  theme: 'light',
  showMarkers: false,
  use3dTerrain: false,
  title: 'Test Story Map',
  subtitle: 'Test Subtitle',
  byline: 'Test Byline',
  chapters: [],
  titleTransition: { location: createTestPosition() },
});

export const createTestStoryMap = (): StoryMapNode => ({
  id: 'test-story-map-id',
  title: 'Test Story Map',
  slug: 'test-story-map',
  configuration: createTestStoryMapConfig(),
  createdAt: new Date().toString(),
  createdBy: createTestUser(),
  isPublished: true,
  membershipList: {
    id: 'test-membership-list',
    enrollMethod: 'INVITE',
    membershipType: 'CLOSED',
    memberships: createTestGraphQLConnection([]),
  },
  publishedAt: new Date().toString(),
  publishedConfiguration: createTestStoryMapConfig(),
  storyMapId: 'test-story-map-id',
  updatedAt: new Date().toString(),
});

export const createTestDataEntryNode = (): DataEntryNode => ({
  id: 'test-data-entry-id',
  name: 'test title',
  description: 'test description',
  resourceType: 'DATA_ENTRY',
  createdBy: createTestUser(),
  createdAt: new Date().toString(),
  sharedResources: createTestGraphQLConnection([]),
  entryType: 'FILE',
  url: 'https://test.com',
  visualizations: createTestGraphQLConnection([]),
});

export const createTestVisualizationConfigNode = (
  overrides: Partial<VisualizationConfigNode> = {}
): VisualizationConfigNode => ({
  id: 'test-node-id',
  title: 'Test title',
  description: `Test description`,
  createdAt: new Date().toString(),
  readableId: `test-readable-id`,
  slug: `test-title`,
  mapboxTilesetId: `tileset-test`,
  mapboxTilesetStatus: 'READY',
  configuration: JSON.stringify({ visualization: 'test' }),
  geojson: JSON.stringify({ type: 'FeatureCollection', features: [] }),
  dataEntry: createTestDataEntryNode(),
  ...overrides,
});
