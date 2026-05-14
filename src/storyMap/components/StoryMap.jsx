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

import { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
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
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import StoryMapOutline from 'terraso-web-client/storyMap/components/StoryMapOutline';

import theme from 'terraso-web-client/theme';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const Audio = ({ record }) => {
  return (
    <>
      <audio style={{ width: '100%' }} controls>
        <source src={record.media.signedUrl} type={record.media.type} />
      </audio>
    </>
  );
};

const Video = ({ record }) => {
  return (
    <>
      <video style={{ width: '100%' }} controls>
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
    />
  );
};

const Chapter = ({ theme, record, active }) => {
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

const MapTransitionController = ({ config, currentChapter }) => {
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'));
  const { map, mapDimensions } = useMap();

  useEffect(() => {
    if (!mapDimensions) {
      return;
    }
    startTransition(map, {
      config,
      chapterId: currentChapter,
      mapDimensions,
      isMobile,
    });
  }, [map, config, mapDimensions, currentChapter, isMobile]);

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
  } = props;

  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'));
  const containerRef = useRef();

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

  return (
    <Box
      ref={containerRef}
      component="section"
      aria-label={t('storyMap.view_map_label')}
      // we're using container queries here because of the CSS quirk that
      // margin-top: -100% refers to the ancestor's _width_, not height
      sx={
        isContained
          ? { height: '100%', overflowY: 'auto', containerType: 'size' }
          : {}
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
        interactive={isMobile && isMapFullscreen}
        mapStyle={config.style}
        projection={config.projection}
        zoom={1}
        initialLocation={initialLocation}
        sx={({ breakpoints }) => ({
          position: 'sticky',
          height: '100cqh',
          width: '100%',
          [breakpoints.not('xs')]: {
            top: 0,
          },
          [breakpoints.only('xs')]: isMapFullscreen
            ? { position: 'fixed', bottom: 0, zIndex: 4 }
            : { top: 0, height: '33vh', zIndex: 4 },
        })}
      >
        <FullscreenButton
          isFullscreen={isMapFullscreen}
          onToggle={() => setIsMapFullscreen(prev => !prev)}
        />

        {!_.isEmpty(config.dataLayers) &&
          Object.values(config.dataLayers).map(dataLayerConfig => (
            <StoryMapLayer
              key={dataLayerConfig.id}
              config={dataLayerConfig}
              changeBounds={false}
              opacity={0}
            />
          ))}

        <MapTransitionController
          // NOTE: the MapTransitionController unfortunately must come AFTER any map layers
          // due to timing of the react render lifecycle and imperative mapbox events.
          // hopefully this will be less janky in the future.
          config={config}
          currentChapter={currentChapter}
        />
      </Map>
      <Box
        sx={({ breakpoints }) => ({
          [breakpoints.not('xs')]: { marginTop: '-100cqh' },
        })}
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
              theme={config.theme}
              record={chapter}
              active={currentChapter === chapter.id}
            />
          </div>
        ))}
      </Box>
      {config.footer && (
        <Box id="footer" className={config.theme}>
          <p>{config.footer}</p>
        </Box>
      )}
    </Box>
  );
};

export default StoryMap;
