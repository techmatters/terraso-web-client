import * as groupService from 'group/groupService'
import * as landscapeService from 'landscape/landscapeService'

export const fetchDashboardData = () => Promise.resolve()
  .then(() => ([
    groupService.fetchGroups(),
    landscapeService.fetchLandscapes()
  ]))
  .then(promises => Promise.all(promises))
  .then(([groups, landscapes]) => ({ landscapes, groups }))
