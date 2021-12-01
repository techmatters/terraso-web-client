import * as groupService from 'group/groupService'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

test('GroupService: Fetch group', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    group: {
      name: 'Group Name',
      description: 'Group Description',
      website: 'www.group.org'
    }
  }))
  const group = await groupService.fetchGroup()
  expect(group).toStrictEqual({
    name: 'Group Name',
    description: 'Group Description',
    website: 'www.group.org'
  })
})
test('GroupService: Fetch group not found', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    group: null
  }))
  await expect(groupService.fetchGroup()).rejects.toEqual('group.not_found')
})
test('GroupService: Fetch group backend error', async () => {
  terrasoApi.request.mockReturnValue(Promise.reject('Test error'))
  await expect(groupService.fetchGroup()).rejects.toEqual('Test error')
})
