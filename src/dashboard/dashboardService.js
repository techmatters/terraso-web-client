
export const fetchDashboardData = () => Promise.resolve()
  .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
  .then(() => {
    return {
      landscapes: [{
        id: 'test-id-1',
        name: 'Landscape Name',
        role: 'manager'
      }, {
        id: 'test-id-2',
        name: 'Landscape Name 2',
        role: 'member'
      }],
      groups: [{
        id: 'group-1',
        name: 'Group 1',
        role: 'member'
      }, {
        id: 'group-2',
        name: 'Group 2',
        role: 'manager'
      }]
    }
  })
