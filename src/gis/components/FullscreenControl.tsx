/*
 * Copyright © 2026 Technology Matters
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

import { useCallback, useEffect, useState } from 'react';
import type { IControl } from 'mapbox-gl';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { IconButton, Portal, useMediaQuery } from '@mui/material';

import { useMap } from 'terraso-web-client/gis/components/Map';

import theme from 'terraso-web-client/theme';

class MapControl implements IControl {
  _container: HTMLDivElement | undefined;
  onAddContainer: ((container: HTMLDivElement) => void) | undefined;

  constructor(options?: {
    onAddContainer?: (container: HTMLDivElement) => void;
  }) {
    this.onAddContainer = options?.onAddContainer;
  }

  onAdd(): HTMLDivElement {
    this._container = document.createElement('div');
    this.onAddContainer?.(this._container);
    return this._container;
  }

  onRemove(): void {
    this._container?.parentNode?.removeChild(this._container);
  }
}

interface Props {
  isFullscreen: boolean;
  onToggle: () => void;
}

export const FullscreenButton = ({ isFullscreen, onToggle }: Props) => {
  const { map } = useMap();
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'));
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map || !isMobile) {
      return;
    }

    const control = new MapControl({
      onAddContainer: setContainer,
    });
    map.addControl(control, 'top-right');

    return () => {
      map.removeControl(control);
    };
  }, [map, isMobile]);

  if (!container || !isMobile) {
    return null;
  }

  return (
    <Portal container={container}>
      <IconButton
        className="mapboxgl-ctrl-group mapboxgl-ctrl"
        onClick={onToggle}
        size="small"
        // the ripple doesn't look good over the map
        // should be resolved more robustly as part of component work
        disableRipple
        sx={{ bgcolor: 'white' }}
      >
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
    </Portal>
  );
};
