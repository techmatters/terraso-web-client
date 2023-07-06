import { useEffect } from 'react';
import { useMap } from './MapboxMap';

const Layer = props => {
  const { id, layer } = props;
  const { map, addLayer } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const mapLayer = map.getLayer(id);
    if (!mapLayer) {
      addLayer({
        id,
        ...layer,
      });
    }
  }, [id, map, addLayer, layer]);
};

export default Layer;
