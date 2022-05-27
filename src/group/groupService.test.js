import * as groupService from 'group/groupService';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

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
  const group = await groupService.fetchGroupToUpdate();
  expect(group).toStrictEqual({
    name: 'Group name',
    description: 'Group description',
    website: 'https://www.group.org',
  });
});
test('GroupService: Fetch group not found', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      group: null,
    })
  );
  await expect(groupService.fetchGroupToUpdate()).rejects.toEqual('not_found');
});
test('GroupService: Fetch group backend error', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(Promise.reject('Test error'));
  await expect(groupService.fetchGroupToUpdate()).rejects.toEqual('Test error');
});
