import * as groupService from 'group/groupService'

export const fetchDashboardData = () => Promise.resolve()
  .then(() => ([
    groupService.fetchGroups(),
    Promise.resolve([{
      id: 'test-id-1',
      name: 'Altiplano Estepario',
      role: 'manager'
    }, {
      id: 'test-id-2',
      name: 'Galera-San Francisco',
      role: 'member'
    }])
  ]))
  .then(promises => Promise.all(promises))
  .then(([groups, landscapes]) => ({ landscapes, groups }))
