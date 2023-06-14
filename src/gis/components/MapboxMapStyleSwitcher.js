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
import { useEffect, useState } from 'react';
import LayersIcon from '@mui/icons-material/Layers';
import { Button, Menu, MenuItem, Portal, Stack } from '@mui/material';
import { MAPBOX_STYLES } from './MapboxConstants';
import { useMap } from './MapboxMap';

class HelloWorldControl {
  constructor(options) {
    this.node = document.createElement('div');
    this.onAddContainer = options?.onAddContainer;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this.onAddContainer(this._container);
    return this._container;
  }

  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}

const MapboxMapStyleSwitcher = () => {
  const { map, images, sources, layers } = useMap();
  const [container, setContainer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [styleName, setStyleName] = useState('');
  const open = Boolean(anchorEl);
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeStyle = (title, newStyle) => () => {
    setStyleName(title);
    map.setStyle(newStyle);
    handleClose();
    map.once('style.load', () => {
      Object.keys(images).forEach(image => {
        map.addImage(image, images[image]);
      });
      Object.keys(sources).forEach(source => {
        map.addSource(source, sources[source]);
      });
      Object.keys(layers).forEach(layer => {
        map.addLayer(layers[layer]);
      });
    });
  };

  useEffect(() => {
    if (!map) {
      return;
    }

    const stylesControl = new HelloWorldControl({
      onAddContainer: container => {
        setContainer(container);
      },
    });
    map.addControl(stylesControl, 'top-right');

    return () => {
      map.removeControl(stylesControl);
      map.off('styledata');
    };
  }, [map]);

  if (!container) {
    return null;
  }

  return (
    <Portal container={container}>
      <Stack alignItems="flex-end">
        <Button
          className="mapboxgl-ctrl-group mapboxgl-ctrl"
          variant="outlined"
          aria-label="TODO"
          onClick={handleClick}
        >
          <LayersIcon />
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            dense: true,
            'aria-labelledby': 'TODO',
          }}
        >
          {MAPBOX_STYLES.map(({ style, title }) => (
            <MenuItem
              key={title}
              onClick={changeStyle(title, style)}
              selected={styleName === title}
            >
              {title}
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Portal>
  );
};

export default MapboxMapStyleSwitcher;
