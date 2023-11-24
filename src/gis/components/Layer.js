/*
 * Copyright © 2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import { useEffect } from 'react';

import { useMap } from './Map';

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
