import React, { useCallback, useEffect, useMemo } from 'react';

// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';
import _ from 'lodash/fp';

import 'mapbox-gl/dist/mapbox-gl.css';

import scrollama from 'scrollama';

import './StoryMap.css';

import { useTranslation } from 'react-i18next';

import { Box, Link } from '@mui/material';

import { MAPBOX_ACCESS_TOKEN } from 'config';

import { ALIGNMENTS, LAYER_TYPES } from '../storyMapConstants';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

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

const Audio = ({ record }) => {
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls>
        <source src={record.media.content} type={record.media.type} />
      </audio>
    </>
  );
};

const Image = ({ record }) => {
  return <img src={record.media.content} alt={record.title}></img>;
};

const Chapter = ({ theme, record }) => {
  const classList = [
    'step-container',
    'step',
    ALIGNMENTS[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');
  return (
    <Box id={record.id} className={classList}>
      <Box className={`${theme} step-content`}>
        {record.title && <h3 className="title">{record.title}</h3>}
        {record.media &&
          (record.media.type.startsWith('image') ? (
            <Image record={record} />
          ) : record.media.type.startsWith('audio') ? (
            <Audio record={record} />
          ) : null)}
        {record.description && <p>{record.description}</p>}
      </Box>
    </Box>
  );
};

const Title = props => {
  const { t } = useTranslation();
  const { config } = props;

  if (!config.title) return null;

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const onOutlineItemClick = id => event => {
    event.preventDefault();
    scrollTo(id);
  };

  const chapters = config.chapters.map((chapter, index) => ({
    chapter,
    index,
  }));

  return (
    <Box id="header" className="step step-container fully title">
      <Box className={`${config.theme} step-content`}>
        <h1>{config.title}</h1>
        {config.subtitle && <h2>{config.subtitle}</h2>}
        {config.byline && <p>{config.byline}</p>}
        <p>
          {t('storyMap.view_title_outline')}:{' '}
          {_.flow(
            _.map(({ chapter, index }) => ({
              index,
              component: (
                <Link
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  onClick={onOutlineItemClick(chapter.id)}
                >
                  {chapter.title}
                </Link>
              ),
            })),
            _.flatMap(({ component, index }) => [
              component,
              index !== chapters.length - 1 ? (
                <span key={`divider-${index}`}> | </span>
              ) : undefined,
            ])
          )(chapters)}
        </p>
      </Box>
    </Box>
  );
};

const StoryMap = props => {
  const {
    config,
    onStepChange,
    ChapterComponent = Chapter,
    TitleComponent = Title,
    mapCss = { height: '100vh', width: '100vw', top: 0 },
    animation,
  } = props;
  const mapContainer = React.useRef(null);
  const mapInsetContainer = React.useRef(null);
  const [map, setMap] = React.useState(null);
  const [insetMap, setInsetMap] = React.useState(null);
  const [marker, setMarker] = React.useState(null);

  const getLayerPaintType = useCallback(
    layer => {
      const layerType = map.getLayer(layer).type;
      return LAYER_TYPES[layerType];
    },
    [map]
  );

  const setLayerOpacity = useCallback(
    layer => {
      const paintProps = getLayerPaintType(layer.layer);
      paintProps.forEach(function (prop) {
        const options = layer.duration ? { duration: layer.duration } : {};
        if (layer.duration) {
          const transitionProp = prop + '-transition';
          map.setPaintProperty(layer.layer, transitionProp, options);
        }
        map.setPaintProperty(layer.layer, prop, layer.opacity, options);
      });
    },
    [map, getLayerPaintType]
  );

  const initialLocation = useMemo(
    () => config.chapters?.[0]?.location,
    [config.chapters]
  );

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style,
      interactive: false,
      transformRequest: transformRequest,
      projection: config.projection || 'globe',
      zoom: 1,
      ...(initialLocation ? initialLocation : {}),
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

      setMap(map);
    });
    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(169, 169, 188)', // Lower atmosphere
        'high-color': 'rgb(16, 16, 20)', // Upper atmosphere
        'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        'space-color': 'rgb(20, 20, 26)', // Background color
        'star-intensity': 0.1, // Background star brightness (default 0.35 at low zoooms )
      });
    });
    return () => map.remove();
  }, [config.style, initialLocation, config.use3dTerrain, config.projection]);

  useEffect(() => {
    if (!map || !config.inset) return;

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
    if (!map || !config.inset || !insetMap) return;

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
  }, [map, insetMap, config.inset]);

  const startChapter = useCallback(
    chapter => {
      if (!map || (config.inset && !insetMap) || !chapter) return;

      if (chapter.location) {
        map[animation || chapter.mapAnimation || 'flyTo'](chapter.location);

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
          if (!marker) {
            const newMarker = new mapboxgl.Marker({
              color: config.markerColor,
            })
              .setLngLat(chapter.location.center)
              .addTo(map);

            setMarker(newMarker);
          } else {
            marker.setLngLat(chapter.location.center);
          }
        }
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
    },
    [map, config, insetMap, marker, setLayerOpacity, animation]
  );

  useEffect(() => {
    if (!map || (config.inset && !insetMap)) {
      return;
    }

    const scroller = scrollama();
    scroller
      .setup({
        step: '.step',
        offset: 0.5,
        progress: true,
      })
      .onStepEnter(async response => {
        const currentChapter = config.chapters.findIndex(
          chap => chap.id === response.element.id
        );
        const chapter = config.chapters[currentChapter];
        response.element.classList.add('active');
        startChapter(chapter);
        onStepChange?.(response.element.id);

        if (config.auto) {
          const nextChapter = (currentChapter + 1) % config.chapters.length;
          map.once('moveend', () => {
            document
              .querySelectorAll(
                '[data-scrollama-index="' + nextChapter.toString() + '"]'
              )[0]
              .scrollIntoView();
          });
        }
      })
      .onStepExit(response => {
        const chapter = config.chapters.find(
          chap => chap.id === response.element.id
        );
        response.element.classList.remove('active');
        if (chapter?.onChapterExit && chapter.onChapterExit.length > 0) {
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
    startChapter,
    config.title,
    config.chapters,
    config.auto,
    config.inset,
    config.showMarkers,
    onStepChange,
  ]);

  return (
    <>
      <Box id="map" ref={mapContainer} sx={{ ...mapCss }} />
      <Box id="mapInset" ref={mapInsetContainer}></Box>
      <Box id="story">
        <Box id="features" className={ALIGNMENTS[config.alignment]}>
          <TitleComponent config={config} />
          {config.chapters.map(chapter => (
            <ChapterComponent
              key={chapter.id}
              theme={config.theme}
              record={chapter}
            />
          ))}
        </Box>
        {config.footer && (
          <Box id="footer" className={config.theme}>
            <p>{config.footer}</p>
          </Box>
        )}
      </Box>
    </>
  );
};

export default StoryMap;
