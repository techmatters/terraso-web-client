import React, { useCallback, useEffect } from 'react';

// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

import scrollama from 'scrollama';

import './StoryMap.css';

import { MAPBOX_ACCESS_TOKEN } from 'config';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

var layerTypes = {
  fill: ['fill-opacity'],
  line: ['line-opacity'],
  circle: ['circle-opacity', 'circle-stroke-opacity'],
  symbol: ['icon-opacity', 'text-opacity'],
  raster: ['raster-opacity'],
  'fill-extrusion': ['fill-extrusion-opacity'],
  heatmap: ['heatmap-opacity'],
};

var alignments = {
  left: 'lefty',
  center: 'centered',
  right: 'righty',
  full: 'fully',
};

const transformRequest = url => {
  const hasQuery = url.indexOf('?') !== -1;
  const suffix = hasQuery
    ? '&pluginName=scrollytellingV2'
    : '?pluginName=scrollytellingV2';
  return {
    url: url + suffix,
  };
};

const getBoundsJson = bounds => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [bounds._sw.lng, bounds._sw.lat],
            [bounds._ne.lng, bounds._sw.lat],
            [bounds._ne.lng, bounds._ne.lat],
            [bounds._sw.lng, bounds._ne.lat],
            [bounds._sw.lng, bounds._sw.lat],
          ],
        ],
      },
    },
  ],
});

function Chapter({ theme, record }) {
  const classList = [
    'step',
    alignments[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');
  return (
    <div id={record.id} className={classList}>
      <div className={theme}>
        {record.title && <h3 className="title">{record.title}</h3>}
        {record.image && <img src={record.image} alt={record.title}></img>}
        {record.description && <p>{record.description}</p>}
      </div>
    </div>
  );
}

const StoryMap = props => {
  const { config } = props;
  const mapContainer = React.useRef(null);
  const mapInsetContainer = React.useRef(null);
  const [map, setMap] = React.useState(null);
  const [insetMap, setInsetMap] = React.useState(null);
  const [marker, setMarker] = React.useState(null);

  const getLayerPaintType = useCallback(
    layer => {
      var layerType = map.getLayer(layer).type;
      return layerTypes[layerType];
    },
    [map]
  );

  const setLayerOpacity = useCallback(
    layer => {
      var paintProps = getLayerPaintType(layer.layer);
      paintProps.forEach(function (prop) {
        var options = {};
        if (layer.duration) {
          var transitionProp = prop + '-transition';
          options = { duration: layer.duration };
          map.setPaintProperty(layer.layer, transitionProp, options);
        }
        map.setPaintProperty(layer.layer, prop, layer.opacity, options);
      });
    },
    [map, getLayerPaintType]
  );

  useEffect(() => {
    var map = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style,
      center: config.chapters[0].location.center,
      zoom: config.chapters[0].location.zoom,
      bearing: config.chapters[0].location.bearing,
      pitch: config.chapters[0].location.pitch,
      interactive: false,
      transformRequest: transformRequest,
      projection: config.projection,
    });
    map.on('load', function () {
      if (config.use3dTerrain) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        // add the DEM source as a terrain layer with exaggerated height
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }
      if (config.showMarkers) {
        const marker = new mapboxgl.Marker({
          color: config.markerColor,
        })
          .setLngLat(config.chapters[0].location.center)
          .addTo(map);

        setMarker(marker);
      }
      setMap(map);
    });
    return () => map.remove();
  }, [config]);

  useEffect(() => {
    if (!map || !config.inset) return;

    console.log('insetMap', { config });

    const newInsetMap = new mapboxgl.Map({
      container: mapInsetContainer.current,
      style: 'mapbox://styles/mapbox/dark-v10', //hosted style id
      center: config.chapters[0].location.center,
      // Hardcode above center value if you want insetMap to be static.
      zoom: 3, // starting zoom
      hash: false,
      interactive: false,
      attributionControl: false,
      //Future: Once official mapbox-gl-js has globe view enabled,
      //insetmap can be a globe with the following parameter.
      //projection: 'globe'
    });

    newInsetMap.on('load', function () {
      function addInsetLayer(bounds) {
        newInsetMap.addSource('boundsSource', {
          type: 'geojson',
          data: bounds,
        });

        newInsetMap.addLayer({
          id: 'boundsLayer',
          type: 'fill',
          source: 'boundsSource', // reference the data source
          layout: {},
          paint: {
            'fill-color': '#fff', // blue color fill
            'fill-opacity': 0.2,
          },
        });
        // // Add a black outline around the polygon.
        newInsetMap.addLayer({
          id: 'outlineLayer',
          type: 'line',
          source: 'boundsSource',
          layout: {},
          paint: {
            'line-color': '#000',
            'line-width': 1,
          },
        });
      }
      addInsetLayer(map.getBounds());
      setInsetMap(newInsetMap);
    });
    return () => newInsetMap.remove();
  }, [map, config]);

  useEffect(() => {
    if (!map || !insetMap) return;

    function updateInsetLayer(bounds) {
      insetMap.getSource('boundsSource').setData(bounds);
    }

    function getInsetBounds() {
      let bounds = map.getBounds();
      updateInsetLayer(getBoundsJson(bounds));
    }

    // As the map moves, grab and update bounds in inset map.
    map.on('move', getInsetBounds);
    return () => {
      map.off('move', getInsetBounds);
    };
  }, [map, insetMap]);

  useEffect(() => {
    if (!map || (config.inset && !insetMap) || (config.showMarkers && !marker))
      return;

    const scroller = scrollama();
    scroller
      .setup({
        step: '.step',
        offset: 0.5,
        progress: true,
      })
      .onStepEnter(async response => {
        var current_chapter = config.chapters.findIndex(
          chap => chap.id === response.element.id
        );
        var chapter = config.chapters[current_chapter];

        response.element.classList.add('active');
        map[chapter.mapAnimation || 'flyTo'](chapter.location);

        // Incase you do not want to have a dynamic inset map,
        // rather want to keep it a static view but still change the
        // bbox as main map move: comment out the below if section.
        if (config.inset) {
          if (chapter.location.zoom < 5) {
            insetMap.flyTo({ center: chapter.location.center, zoom: 0 });
          } else {
            insetMap.flyTo({ center: chapter.location.center, zoom: 3 });
          }
        }
        if (config.showMarkers) {
          marker.setLngLat(chapter.location.center);
        }
        if (chapter.onChapterEnter.length > 0) {
          chapter.onChapterEnter.forEach(setLayerOpacity);
        }
        if (chapter.callback) {
          window[chapter.callback]();
        }
        if (chapter.rotateAnimation) {
          map.once('moveend', () => {
            const rotateNumber = map.getBearing();
            map.rotateTo(rotateNumber + 180, {
              duration: 30000,
              easing: t => t,
            });
          });
        }
        if (config.auto) {
          var next_chapter = (current_chapter + 1) % config.chapters.length;
          map.once('moveend', () => {
            document
              .querySelectorAll(
                '[data-scrollama-index="' + next_chapter.toString() + '"]'
              )[0]
              .scrollIntoView();
          });
        }
      })
      .onStepExit(response => {
        var chapter = config.chapters.find(
          chap => chap.id === response.element.id
        );
        response.element.classList.remove('active');
        if (chapter.onChapterExit.length > 0) {
          chapter.onChapterExit.forEach(setLayerOpacity);
        }
      });
    window.addEventListener('resize', scroller.resize);
    return () => {
      window.removeEventListener('resize', scroller.resize);
    };
  }, [
    map,
    insetMap,
    marker,
    setLayerOpacity,
    config.chapters,
    config.auto,
    config.inset,
    config.showMarkers,
  ]);

  return (
    <>
      <div>
        <div id="map" ref={mapContainer} />
        <div id="mapInset" ref={mapInsetContainer}></div>
        <div id="story">
          {config.title && (
            <div id="header" className={config.theme}>
              <h1>{config.title}</h1>
              {config.subtitle && <h2>{config.subtitle}</h2>}
              {config.byline && <p>{config.byline}</p>}
            </div>
          )}
          <div id="features" className={alignments[config.alignment]}>
            {config.chapters.map(chapter => (
              <Chapter key={chapter.id} theme={config.theme} record={chapter} />
            ))}
          </div>
          {config.footer && (
            <div id="footer" className={config.theme}>
              <p>{config.footer}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StoryMap;
