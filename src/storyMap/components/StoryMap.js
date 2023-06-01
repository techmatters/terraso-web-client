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
import React, { useCallback, useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import scrollama from 'scrollama';

import { Box } from '@mui/material';

import RichTextEditor from 'common/components/RichTextEditor';

import mapboxgl from 'gis/mapbox';
import { chapterHasVisualMedia } from 'storyMap/storyMapUtils';

import { MAPBOX_ACCESS_TOKEN, STORY_MAP_INSET_STYLE } from 'config';

import {
  ALIGNMENTS,
  LAYER_TYPES,
  MAPBOX_DEM_SOURCE,
  MAPBOX_FOG,
  MAPBOX_SKY_LAYER,
} from '../storyMapConstants';

import './StoryMap.css';

import StoryMapOutline from './StoryMapOutline';

import theme from 'theme';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const CURRENT_LOCATION_CHECK_PRESSISION = 13; // 13 decimal places
const ROTATION_DURATION = 30000; // 30 seconds

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
      <audio style={{ width: '100%' }} controls>
        <source src={record.media.signedUrl} type={record.media.type} />
      </audio>
    </>
  );
};

const Image = ({ record }) => {
  const { t } = useTranslation();
  return (
    <img
      src={record.media.signedUrl || record.media.url}
      alt={t('storyMap.view_chapter_media_label')}
      width="100%"
    ></img>
  );
};

const Chapter = ({ theme, record }) => {
  const { t } = useTranslation();
  const classList = [
    'step-container',
    ALIGNMENTS[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');

  const hasVisualMedia = chapterHasVisualMedia(record);

  return (
    <Box
      component="section"
      aria-label={t('storyMap.view_chapter_label', { title: record.title })}
      className={classList}
    >
      {/* div with ID added because of an Intersection Observer issue with overflow */}
      <Box
        sx={{ position: 'absolute', height: 300, width: '100%' }}
        className="step"
        id={record.id}
      ></Box>
      <Box
        className={`${theme} step-content`}
        sx={{
          width: hasVisualMedia ? '50vw' : 'auto',
        }}
      >
        {record.title && (
          <h3 id={`title-${record.id}`} className="title">
            {record.title}
          </h3>
        )}
        {record.media &&
          (record.media.type.startsWith('image') ? (
            <Image record={record} />
          ) : record.media.type.startsWith('audio') ? (
            <Audio record={record} />
          ) : record.media.type.startsWith('embedded') ? (
            <iframe
              title={record.media.title}
              src={record.media.url}
              style={{ height: '300px', width: '100%' }}
            />
          ) : null)}
        {record.description && (
          <RichTextEditor value={record.description} editable={false} />
        )}
      </Box>
    </Box>
  );
};

const Title = props => {
  const { t } = useTranslation();
  const { config } = props;

  if (!config.title) {
    return null;
  }

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
    <Box
      id="story-map-title"
      component="section"
      aria-label={t('storyMap.view_title_label', { title: config.title })}
      className="step step-container fully title"
    >
      <Box className={`${config.theme} step-content`}>
        <h1 id="story-view-title-id">{config.title}</h1>
        {config.subtitle && <h2>{config.subtitle}</h2>}
        {config.byline && <p>{config.byline}</p>}
        <StoryMapOutline
          chapters={chapters}
          onChapterClick={onOutlineItemClick}
        />
      </Box>
    </Box>
  );
};

const getTransition = (config, id) => {
  const isTitle = id === 'story-map-title';
  if (isTitle) {
    return {
      transition: config.titleTransition,
      index: -1,
    };
  }
  const chapterIndex = config.chapters.findIndex(chapter => chapter.id === id);
  const chapter = config.chapters[chapterIndex];
  return {
    transition: chapter,
    index: chapterIndex,
  };
};

const getStepContainer = response => {
  const element = response.element;
  // Check it element has class step-container
  if (element.classList.contains('step-container')) {
    return element;
  }
  // Check if parent element has class step-container
  if (element.parentElement.classList.contains('step-container')) {
    return element.parentElement;
  }
  return null;
};

const StoryMap = props => {
  const { t } = useTranslation();
  const {
    config,
    onStepChange,
    ChapterComponent = Chapter,
    TitleComponent = Title,
    mapCss = { height: '100vh', width: '100vw', top: 0 },
    animation,
    onReady,
    chaptersFilter,
  } = props;
  const mapContainer = React.useRef(null);
  const mapInsetContainer = React.useRef(null);
  const [map, setMap] = React.useState(null);
  const [insetMap, setInsetMap] = React.useState(null);
  const [marker, setMarker] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    onReady?.();
  }, [isReady, onReady]);

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

  const initialLocation = useMemo(() => {
    if (config.titleTransition?.location) {
      return config.titleTransition?.location;
    }
    const firstChapterWithLocation = config.chapters.find(
      chapter => chapter.location
    );
    return firstChapterWithLocation?.location;
  }, [config.chapters, config.titleTransition?.location]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style,
      interactive: false,
      projection: config.projection || 'globe',
      zoom: 1,
      ...(initialLocation ? initialLocation : {}),
    });

    map.on('load', function () {
      if (config.use3dTerrain) {
        map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);
        // add the DEM (Digital Elevation Model) source as a terrain layer with exaggerated height
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer(MAPBOX_SKY_LAYER);
      }

      setMap(map);
    });
    map.on('style.load', () => {
      map.setFog(MAPBOX_FOG);
    });
    return () => map.remove();
  }, [config.style, initialLocation, config.use3dTerrain, config.projection]);

  useEffect(() => {
    if (!map || !config.inset) {
      return;
    }

    const newInsetMap = new mapboxgl.Map({
      container: mapInsetContainer.current,
      style: STORY_MAP_INSET_STYLE, //hosted style id
      center: initialLocation?.center,
      zoom: 3, // starting zoom
      hash: false,
      interactive: false,
      attributionControl: false,
      // Future: Once official mapbox-gl-js has globe view enabled,
      // insetmap can be a globe with the following parameter.
      // projection: 'globe'
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
            'fill-color': theme.palette.white,
            'fill-opacity': 0.2,
          },
        });
        // Add a black outline around the polygon.
        newInsetMap.addLayer({
          id: 'outlineLayer',
          type: 'line',
          source: 'boundsSource',
          layout: {},
          paint: {
            'line-color': theme.palette.black,
            'line-width': 1,
          },
        });
      }
      addInsetLayer(map.getBounds());
      setInsetMap(newInsetMap);
    });
    return () => newInsetMap.remove();
  }, [map, config.inset, initialLocation]);

  useEffect(() => {
    if (!map || !config.inset || !insetMap) {
      return;
    }

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

  const startTransition = useCallback(
    transition => {
      if (!map || (config.inset && !insetMap) || !transition) {
        return;
      }

      if (transition.location) {
        const mapCenter = map.getCenter();
        const transitionCenter = transition.location.center;

        // Check if the map is already at the transition center
        const decimalPlaces = CURRENT_LOCATION_CHECK_PRESSISION;
        const isInLocation =
          mapCenter.lng.toFixed(decimalPlaces) ===
            transitionCenter.lng.toFixed(decimalPlaces) &&
          mapCenter.lat.toFixed(decimalPlaces) ===
            transitionCenter.lat.toFixed(decimalPlaces);

        if (!isInLocation) {
          map[animation || transition.mapAnimation || 'flyTo'](
            transition.location
          );

          // If you do not want to have a dynamic inset map,
          // rather want to keep it a static view but still change the
          // bbox as main map move: comment out the below if section.
          if (config.inset) {
            if (transition.location.zoom < 5) {
              insetMap.flyTo({ center: transition.location.center, zoom: 0 });
            } else {
              insetMap.flyTo({ center: transition.location.center, zoom: 3 });
            }
          }
          if (config.showMarkers) {
            if (!marker) {
              const newMarker = new mapboxgl.Marker({
                color: config.markerColor,
              })
                .setLngLat(transition.location.center)
                .addTo(map);

              setMarker(newMarker);
            } else {
              marker.setLngLat(transition.location.center);
            }
          }
        }
      }
      if (transition.onChapterEnter && transition.onChapterEnter.length > 0) {
        transition.onChapterEnter.forEach(setLayerOpacity);
      }
      if (transition.rotateAnimation) {
        map.once('moveend', () => {
          const rotateNumber = map.getBearing();
          map.rotateTo(rotateNumber + 180, {
            duration: ROTATION_DURATION,
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
      })
      .onStepEnter(async response => {
        console.log({ response });
        const { index, transition } = getTransition(
          {
            titleTransition: config.titleTransition,
            chapters: config.chapters,
          },
          response.element.id
        );

        getStepContainer(response)?.classList.add('active');
        startTransition(transition);
        onStepChange?.(response.element.id);

        if (config.auto) {
          const nextChapterIndex = (index + 1) % config.chapters.length;
          map.once('moveend', () => {
            document
              .querySelectorAll(
                '[data-scrollama-index="' + nextChapterIndex.toString() + '"]'
              )[0]
              .scrollIntoView();
          });
        }
      })
      .onStepExit(response => {
        const { transition } = getTransition(
          {
            titleTransition: config.titleTransition,
            chapters: config.chapters,
          },
          response.element.id
        );
        getStepContainer(response)?.classList.remove('active');
        if (transition?.onChapterExit && transition.onChapterExit.length > 0) {
          transition.onChapterExit.forEach(setLayerOpacity);
        }
      });

    setIsReady(true);

    window.addEventListener('resize', scroller.resize);
    return () => {
      scroller.destroy();
      window.removeEventListener('resize', scroller.resize);
    };
  }, [
    map,
    insetMap,
    marker,
    setLayerOpacity,
    startTransition,
    config.title,
    config.titleTransition,
    config.chapters,
    config.auto,
    config.inset,
    config.showMarkers,
    onStepChange,
  ]);

  const filteredChapters = useMemo(() => {
    if (!chaptersFilter) {
      return config.chapters;
    }
    return config.chapters.filter(chaptersFilter);
  }, [config.chapters, chaptersFilter]);

  return (
    <>
      <section aria-label={t('storyMap.view_map_label')}>
        <Box id="map" ref={mapContainer} sx={{ ...mapCss }} />
        <Box id="map-inset" ref={mapInsetContainer}></Box>
      </section>
      <Box id="story">
        <Box
          component="section"
          aria-label={t('storyMap.view_chapters_label')}
          id="features"
          className={ALIGNMENTS[config.alignment]}
        >
          <TitleComponent config={config} />
          {filteredChapters.map(chapter => (
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
