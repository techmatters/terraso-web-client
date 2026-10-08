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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, useMediaQuery } from '@mui/material';

import RichTextEditor from 'terraso-web-client/common/components/RichTextEditor/index';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import useActiveStep from 'terraso-web-client/storyMap/components/useActiveStep';
import { startTransition } from 'terraso-web-client/storyMap/mapUtils';
import {
  ALIGNMENTS,
  STORY_MAP_TITLE_ID,
} from 'terraso-web-client/storyMap/storyMapConstants';
import { chapterHasVisualMedia } from 'terraso-web-client/storyMap/storyMapUtils';

import { MAPBOX_ACCESS_TOKEN } from 'terraso-web-client/config';

import 'terraso-web-client/storyMap/components/StoryMap.css';

import { FullscreenButton } from 'terraso-web-client/gis/components/FullscreenControl';
import Map, { useMap } from 'terraso-web-client/gis/components/Map';
import { MapConfigLayerStackProvider } from 'terraso-web-client/storyMap/components/mapConfigLayerStack';
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import StoryMapOutline from 'terraso-web-client/storyMap/components/StoryMapOutline';
import { enforceMapLayerOrder } from 'terraso-web-client/storyMap/mapUtils';
import { getStoryMapThemeCssVariables } from 'terraso-web-client/storyMap/storyMapThemeUtils';

import theme from 'terraso-web-client/theme';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const Audio = ({ record }) => {
  return (
    <>
      <audio style={{ width: '100%' }} controls loading="lazy">
        <source src={record.media.signedUrl} type={record.media.type} />
      </audio>
    </>
  );
};

const Video = ({ record }) => {
  return (
    <>
      <video style={{ width: '100%' }} controls loading="lazy">
        <source src={record.media.signedUrl} type={record.media.type} />
      </video>
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
      loading="lazy"
    ></img>
  );
};

const Embedded = ({ record }) => {
  return (
    <iframe
      allowFullScreen
      title={record.media.title}
      src={record.media.url}
      style={{ height: '300px', width: '100%' }}
      loading="lazy"
    />
  );
};

const Chapter = ({ record, active }) => {
  const { t } = useTranslation();
  const className = [
    'step-container',
    ALIGNMENTS[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');

  const hasVisualMedia = chapterHasVisualMedia(record);
  return (
    <Box
      component="section"
      aria-label={t('storyMap.view_chapter_label', { title: record.title })}
      className={className}
      sx={({ breakpoints }) => ({
        [breakpoints.not('xs')]: { opacity: active ? 0.99 : 0.25 },
      })}
    >
      <Box
        className="story-theme step-content"
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
          ) : record.media.type.startsWith('video') ? (
            <Video record={record} />
          ) : record.media.type.startsWith('audio') ? (
            <Audio record={record} />
          ) : record.media.type.startsWith('embedded') ? (
            <Embedded record={record} />
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
  const { config, active } = props;

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
      component="section"
      aria-label={t('storyMap.view_title_label', { title: config.title })}
      className="step-container title fully"
      sx={({ breakpoints }) => ({
        [breakpoints.not('xs')]: { opacity: active ? 0.99 : 0.25 },
      })}
    >
      <Box className="story-theme step-content">
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

const MapTransitionController = ({
  config,
  currentChapter,
  layerRevision,
  mapEditMode,
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'));
  const { map, mapDimensions } = useMap();

  useEffect(() => {
    if (!mapDimensions || mapEditMode) {
      // While the map configuration overlay is open (mapEditMode), the draft
      // preview owns the camera and the layer stack: transitions must not
      // fight the user's map dragging. They resume as soon as the overlay
      // closes.
      return;
    }
    startTransition(map, {
      config,
      chapterId: currentChapter,
      mapDimensions,
      isMobile,
    });
  }, [
    map,
    config,
    mapDimensions,
    currentChapter,
    isMobile,
    layerRevision,
    mapEditMode,
  ]);

  return null;
};

/**
 * Keeps the mapbox z-order in sync with the map configuration overlay's
 * draft order while it edits the shared map (re-runs when a layer sublayer
 * lands on the map).
 */
const MapLayerOrderSync = ({ mapLayers, revision }) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    enforceMapLayerOrder(map, mapLayers);
  }, [map, mapLayers, revision]);

  return null;
};

// the basic state machine here is:
// MapTransitionController calls startTransition (which moves the map).
// this is a cheap and idempotent operation, so we call it liberally.
// it's called in a useEffect, which depends on:
//   - the story map's config, to pick up chapter alignment changes
//   - the current chapter, which is a piece of state updated by an IntersectionObserver hook
//   - whether we're in a mobile viewport (which forces a centered chapter)
//   - the map dimensions, so we readjust when the map's size changes
const StoryMap = props => {
  const { t } = useTranslation();
  const {
    config,
    onStepChange,
    ChapterComponent = Chapter,
    TitleComponent = Title,
    onReady,
    chaptersFilter,
    isContained = false,
    // NAMED mode, stated at the call site — never inferred here from the
    // overlay's presence. In mapEditMode the fullscreen map configuration
    // overlay is hosted over the shared map and five behaviors change:
    //   1. the map is interactive (drag/zoom the draft camera),
    //   2. the chapter content is dimmed, inert and click-through,
    //   3. chapter transitions are suspended,
    //   4. the layer stack renders the overlay's DRAFT configs (same mounts),
    //   5. the draft layer order is enforced on the shared map.
    mapEditMode = false,
    mapConfigOverlay = null,
  } = props;

  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [layerRevision, setLayerRevision] = useState(0);
  // The overlay's draft layer stack (published via
  // MapConfigLayerStackProvider): the same StoryMapLayer mounts take their
  // dataset from here while editing.
  const [mapConfigLayerStack, setMapConfigLayerStack] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'));
  const containerRef = useRef();

  const onLayerAdded = useCallback(() => {
    setLayerRevision(revision => revision + 1);
  }, []);

  const { activeId, registerStep } = useActiveStep({
    scrollRoot: isContained ? containerRef : null,
    onStepChange,
    onReady,
  });

  const currentChapter = activeId ?? STORY_MAP_TITLE_ID;

  const initialLocation = useMemo(() => {
    if (config.titleTransition?.location) {
      return config.titleTransition?.location;
    }
    const firstChapterWithLocation = config.chapters.find(
      chapter => chapter.location
    );
    return firstChapterWithLocation?.location;
  }, [config.chapters, config.titleTransition?.location]);

  const filteredChapters = useMemo(() => {
    if (!chaptersFilter) {
      return config.chapters;
    }
    return config.chapters.filter(chaptersFilter);
  }, [config.chapters, chaptersFilter]);

  const storyMapThemeStyles = useMemo(
    () => getStoryMapThemeCssVariables(config),
    [config]
  );

  return (
    <Box
      ref={containerRef}
      component="section"
      aria-label={t('storyMap.view_map_label')}
      // we're using container queries here because of the CSS quirk that
      // margin-top: -100% refers to the ancestor's _width_, not height
      sx={
        isContained
          ? {
              ...storyMapThemeStyles,
              height: '100%',
              overflowY: 'auto',
              containerType: 'size',
            }
          : storyMapThemeStyles
      }
    >
      <Box
        // this box displays specifically when the map is full screen, to take up
        // the space the map used to be taking to maintain scroll position
        sx={({ breakpoints }) => ({
          display: 'none',
          [breakpoints.only('xs')]: isMapFullscreen
            ? { display: 'block', height: '33vh' }
            : {},
        })}
      />
      <Map
        id="map"
        interactive={mapEditMode || (isMobile && isMapFullscreen)}
        mapStyle={config.style}
        projection={config.projection}
        zoom={1}
        initialLocation={initialLocation}
        sx={({ breakpoints }) => ({
          width: '100%',
          [breakpoints.not('xs')]: {
            position: 'sticky',
            top: 0,
            height: '100cqh',
          },
          [breakpoints.only('xs')]: isMapFullscreen
            ? isContained
              ? {
                  // preview/embed: keep the map bounded to the size
                  // container. fixed positioning is viewport-anchored even
                  // inside the container (container-type doesn't establish
                  // a containing block for fixed elements), so the bound
                  // must come from the unit: 100cqh resolves to the
                  // container's height. horizontal placement stays at its
                  // static position so the map keeps to its pane
                  position: 'fixed',
                  bottom: 0,
                  height: '100cqh',
                  zIndex: 4,
                }
              : {
                  // no size container (public viewer): cover the visible
                  // viewport exactly. 100cqh falls back to 100svh here,
                  // which doesn't track mobile browser chrome, so a
                  // bottom-anchored map falls short at the top when the
                  // browser toolbar is collapsed and chapter content shows
                  // through the gap; stretching between top and bottom
                  // always matches the visible area
                  position: 'fixed',
                  top: 0,
                  bottom: 0,
                  height: 'auto',
                  zIndex: 4,
                }
            : { position: 'sticky', top: 0, height: '33vh', zIndex: 4 },
        })}
      >
        <FullscreenButton
          isFullscreen={isMapFullscreen}
          onToggle={() => setIsMapFullscreen(prev => !prev)}
        />

        {/* ONE mount point per mapbox layer id: while the overlay is open
            these mounts take their dataset from its DRAFT (a different
            dataset, same mounts); otherwise from the config's dataLayers.
            The two sets are never mounted side by side — two owners of one
            mapbox id steal it from each other and refetch the GeoJSON on
            every open/cancel. */}
        {(mapEditMode
          ? (mapConfigLayerStack?.configs ?? [])
          : Object.values(config.dataLayers ?? {})
        ).map(dataLayerConfig => (
          <StoryMapLayer
            key={dataLayerConfig.id}
            config={dataLayerConfig}
            useConfigBounds={mapEditMode}
            changeBounds={
              mapEditMode
                ? dataLayerConfig.id ===
                  mapConfigLayerStack?.changeBoundsLayerId
                : false
            }
            // Keep the camera when the just-added layer is already visible:
            // the union fit only kicks in when the layer is fully outside the
            // viewport (branch 1's fit-on-add semantics, carried onto the
            // single mount point).
            avoidMoveWhenVisible={mapEditMode}
            opacity={mapEditMode ? undefined : 0}
            onLayerAdded={onLayerAdded}
          />
        ))}

        {mapEditMode && (
          <MapLayerOrderSync
            mapLayers={mapConfigLayerStack?.order ?? []}
            revision={layerRevision}
          />
        )}

        <MapConfigLayerStackProvider value={setMapConfigLayerStack}>
          {mapConfigOverlay}
        </MapConfigLayerStackProvider>

        <MapTransitionController
          // NOTE: the MapTransitionController unfortunately must come AFTER any map layers
          // due to timing of the react render lifecycle and imperative mapbox events.
          // hopefully this will be less janky in the future.
          config={config}
          currentChapter={currentChapter}
          layerRevision={layerRevision}
          mapEditMode={mapEditMode}
        />
      </Map>
      <Box
        sx={({ breakpoints }) => ({
          [breakpoints.not('xs')]: { marginTop: '-100cqh' },
          // The chapter cards stay visible at ~20% opacity while the map
          // configuration overlay is open (so the user can see where the
          // content will sit) but let pointer events through to the map.
          ...(mapEditMode ? { opacity: 0.2, pointerEvents: 'none' } : {}),
        })}
        // Modal semantics: the dimmed chapter forms are removed from the
        // focus order and the accessibility tree while the overlay is open
        // (20% opacity + pointer-events: none blocks the mouse only).
        inert={mapEditMode}
        component="section"
        aria-label={t('storyMap.view_chapters_label')}
        id="features"
        className={ALIGNMENTS[config.alignment]}
      >
        <div ref={registerStep} id={STORY_MAP_TITLE_ID}>
          <TitleComponent
            config={config}
            active={currentChapter === STORY_MAP_TITLE_ID}
          />
        </div>
        {filteredChapters.map(chapter => (
          <div key={chapter.id} ref={registerStep} id={chapter.id}>
            <ChapterComponent
              record={chapter}
              active={currentChapter === chapter.id}
            />
          </div>
        ))}
      </Box>
      {config.footer && (
        <Box id="footer" className="story-theme">
          <p>{config.footer}</p>
        </Box>
      )}
    </Box>
  );
};

export default StoryMap;
