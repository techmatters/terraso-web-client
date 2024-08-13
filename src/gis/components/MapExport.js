/*
 * Copyright © 2021-2023 Technology Matters
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

import { useCallback, useEffect } from 'react';

import { useMap } from './Map';

const MapExport = props => {
  const { onImagePrinterChange } = props;
  const { map } = useMap();

  const download = useCallback(
    title => {
      if (!map) {
        return;
      }

      const canvas = map.getCanvas();
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = `${title}.png`;
      link.click();
    },
    [map]
  );

  useEffect(() => {
    if (!map) {
      return;
    }
    onImagePrinterChange(() => download);
  }, [map, onImagePrinterChange, download]);

  return null;
};

export default MapExport;
