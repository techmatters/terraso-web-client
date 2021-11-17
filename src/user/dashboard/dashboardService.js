
// TODO connect to API
export const fetchDashboardData = () => Promise.resolve()
  .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
  .then(() => {
    return {
      landscapes: [{
        id: 'test-id-1',
        name: 'Altiplano Estepario',
        role: 'manager'
      }, {
        id: 'test-id-2',
        name: 'Galera-San Francisco',
        role: 'member'
      }],
      groups1: [{
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
