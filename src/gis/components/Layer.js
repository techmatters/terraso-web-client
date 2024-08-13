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
  const { id, layer, images, events } = props;
  const { map, addLayer, removeLayer, addImage, removeImage } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    if (map.getStyle() && map.getLayer(id)) {
      removeLayer(id);
    }

    images?.forEach(image => {
      if (map.hasImage(image.name)) {
        removeImage(image.name);
      }
      addImage(image.name, image.content);
    });
    addLayer({
      id,
      ...layer,
    });

    const eventsParams =
      events?.map((event, index) => {
        const eventGenerator =
          typeof event === 'function' ? event : () => event;
        return eventGenerator(map);
      }) || [];
    eventsParams.forEach(eventParams => map.on(...eventParams));

    return () => {
      eventsParams.forEach(eventParams => map.off(...eventParams));
      removeLayer(id);
    };
  }, [
    id,
    map,
    addLayer,
    images,
    addImage,
    layer,
    events,
    removeLayer,
    removeImage,
  ]);
};

export default Layer;
