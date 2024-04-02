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
import 'tests/utils';

import * as terrasoApiToMock from 'terraso-client-shared/terrasoApi/api';

import * as groupService from 'group/groupService';

jest.mock('terraso-client-shared/terrasoApi/api');
const terrasoApi = jest.mocked(terrasoApiToMock);

test('GroupService: Fetch group', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              name: 'Group name',
              description: 'Group description',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
  );
  const group = await groupService.fetchGroupToUpdate('');
  expect(group).toStrictEqual({
    name: 'Group name',
    description: 'Group description',
    website: 'https://www.group.org',
    membershipsInfo: {
      accountMembership: undefined,
      enrollMethod: undefined,
      membershipType: undefined,
      memberships: [],
      pendingCount: undefined,
      totalCount: undefined,
    },
    sharedResources: undefined,
  });
});
test('GroupService: Fetch group not found', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: { edges: [] },
    })
  );
  await expect(groupService.fetchGroupToUpdate('')).rejects.toEqual(
    'not_found'
  );
});
test('GroupService: Fetch group backend error', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(Promise.reject('Test error'));
  await expect(groupService.fetchGroupToUpdate('')).rejects.toEqual(
    'Test error'
  );
});
