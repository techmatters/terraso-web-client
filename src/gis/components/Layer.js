import { useEffect } from 'react';

import { useMap } from './MapboxMap';

const Layer = props => {
  const { id, layer, images } = props;
  const { map, addLayer, addImage } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const mapLayer = map.getLayer(id);
    if (!mapLayer) {
      images?.forEach(image => {
        addImage(image.name, image.content);
      });
      addLayer({
        id,
        ...layer,
      });
    }
  }, [id, map, addLayer, images, addImage, layer]);
};

export default Layer;
