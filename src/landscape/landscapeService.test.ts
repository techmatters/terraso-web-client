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
import * as terrasoApiToMock from 'terraso-client-shared/terrasoApi/api';

import * as landscapeService from 'landscape/landscapeService';

jest.mock('terraso-client-shared/terrasoApi/api');
const terrasoApi = jest.mocked(terrasoApiToMock);

test('LandscapeService: Fetch landscape with missing fields', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape name',
              description: 'Landscape description',
              website: 'https://www.landscape.org',
            },
          },
        ],
      },
    })
  );
  const landscape = await landscapeService.fetchLandscapeToView('', {
    email: 'test@test.com',
  });
  expect(landscape).toStrictEqual({
    name: 'Landscape name',
    description: 'Landscape description',
    website: 'https://www.landscape.org',
    areaPolygon: null,
    accountMembership: undefined,
    membershipInfo: {
      accountMembership: undefined,
      enrollMethod: undefined,
      membershipType: undefined,
      memberships: [],
      pendingCount: undefined,
      totalCount: undefined,
    },
    partnership: undefined,
    partnershipStatus: undefined,
    sharedResources: undefined,
    taxonomyTerms: {},
    developmentStrategy: undefined,
    affiliatedGroups: [],
  });
});
