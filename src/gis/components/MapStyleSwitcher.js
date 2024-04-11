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
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LayersIcon from '@mui/icons-material/Layers';
import { Button, Menu, MenuItem, Portal, Stack } from '@mui/material';

import { useMap } from './Map';
import { MAPBOX_STYLES } from './MapboxConstants';

class SwitcherControl {
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

const MapStyleSwitcher = props => {
  const { position = 'top-right', onStyleChange } = props;
  const { t } = useTranslation();
  const { map, changeStyle } = useMap();
  const [container, setContainer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [styleName, setStyleName] = useState('');
  const open = Boolean(anchorEl);

  const handleClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const changeStylePartial = useCallback(
    (title, newStyle) => () => {
      if (title === styleName) {
        handleClose();
        return;
      }
      setStyleName(title);
      changeStyle(newStyle);
      handleClose();
    },
    [changeStyle, handleClose, styleName]
  );

  const handleChangeStyle = useCallback(
    (title, newStyle) => () => {
      const confirmChangeStyle = changeStylePartial(title, newStyle);
      if (
        onStyleChange &&
        !onStyleChange({
          title,
          newStyle,
          confirmChangeStyle,
        })
      ) {
        return;
      }
      confirmChangeStyle();
    },
    [changeStylePartial, onStyleChange]
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    const stylesControl = new SwitcherControl({
      onAddContainer: container => {
        setContainer(container);
      },
    });
    map.addControl(stylesControl, position);

    return () => {
      map.removeControl(stylesControl);
      map.off('styledata');
    };
  }, [map, position]);

  if (!container) {
    return null;
  }

  return (
    <Portal container={container}>
      <Stack alignItems="flex-end">
        <Button
          size="small"
          className="mapboxgl-ctrl-group mapboxgl-ctrl"
          variant="outlined"
          aria-label={t('gis.mapbox_style_switcher_label')}
          onClick={handleClick}
          sx={{
            minWidth: 'auto',
            border: 'none',
            '&:hover': { border: 'none' },
            pb: 0.7,
            pt: 0.7,
          }}
        >
          <LayersIcon aria-label={t('gis.basemap_label')} />
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            dense: true,
            'aria-label': t('gis.mapbox_style_switcher_label'),
          }}
        >
          {MAPBOX_STYLES.map(({ style, titleKey }) => (
            <MenuItem
              key={titleKey}
              onClick={handleChangeStyle(titleKey, style)}
              selected={styleName === titleKey}
            >
              {t(titleKey)}
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Portal>
  );
};

export default MapStyleSwitcher;
