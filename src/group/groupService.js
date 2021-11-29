
// TODO connect to API
export const fetchGroup = () => Promise.resolve()
  .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
  .then(() => ({
    group: {
      name: 'Rainforest Alliance',
      description: 'The Rainforest Alliance is an international non-profit organization working at the intersection of business, agriculture, and forests to make responsible business the new normal. We are building an alliance to protect forests, improve the livelihoods of farmers and forest communities, promote their human rights, and help them mitigate and adapt to the climate crisis.',
      email: 'info@ra.org',
      website: 'www.rainforest-alliance.org'
    }
  }))

export const saveGroup = group => Promise.resolve()
  .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
  .then(() => ({ group }))
