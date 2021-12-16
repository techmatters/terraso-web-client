import _ from 'lodash';

const generateUrl = name => `https://nominatim.openstreetmap.org/search.php?q=${name}&format=jsonv2`;

export const getPlaceInfoByName = name => fetch(generateUrl(name))
  .then(response => response.json())
  .then(json => _.get(json, '[0]'))
  .catch(error => {
    console.error(
      'Failed to request data from nominatim.openstreetmap.org API',
      'Name:', name,
      'Error:', error
    );
    return Promise.reject('gis.openstreetmap_api_error');
  });
