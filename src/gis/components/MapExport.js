import { useEffect } from 'react';

import L from 'leaflet';

import 'leaflet-easyprint';

import { useMap } from 'react-leaflet';

const MapExport = props => {
  const { onImagePrinterChange } = props;
  const map = useMap();

  useEffect(() => {
    const control = new L.Control.EasyPrint({
      position: 'bottomright',
      sizeModes: ['Current'],
      exportOnly: true,
      hideControlContainer: true,
    });
    map.addControl(control);
    onImagePrinterChange(control);

    const container = control.getContainer();

    // Hide donwload button in map
    container.getElementsByTagName('a')[0].classList.add('visually-hidden');
    return () => {
      map.removeControl(control);
    };
  }, [map, onImagePrinterChange]);

  return null;
};

export default MapExport;
