import _ from 'lodash'

const generateUrl = name => `https://nominatim.openstreetmap.org/search.php?q=${name}&format=jsonv2`

export const getPlaceInfoByName = name => fetch(generateUrl(name))
  .then(response => response.json())
  .then(json => _.get(json, '[0]'))
