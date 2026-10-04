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

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';
import { useState } from 'react';
import MapboxGlGeocoder from '@mapbox/mapbox-gl-geocoder';
import {
  createLoadedMapMock,
  setupMapboxMock,
} from 'terraso-web-client/tests/mapboxMock';

import mapboxgl from 'terraso-web-client/gis/mapbox';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';
import {
  CHAPTER_ONLY_CONTENT_MAX_WIDTH,
  CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR,
} from 'terraso-web-client/storyMap/storyMapConstants';
import { isChapterEmpty } from 'terraso-web-client/storyMap/storyMapUtils';

// Mock mapboxgl
jest.mock('terraso-web-client/gis/mapbox', () => ({}));

// The layer stack (StoryMapLayer → VisualizationMapLayer) has its own tests;
// the transition-wiring tests below only observe startTransition's output on
// the map mock, so layers render as inert stubs here.
jest.mock('terraso-web-client/storyMap/components/StoryMapLayer', () => ({
  __esModule: true,
  StoryMapLayer: ({ config }) => (
    <div data-testid={`mock-layer-${config?.id}`} />
  ),
}));

setupMapboxMock();

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const CONFIG = {
  style: 'mapbox://styles/terraso/test',
  title: 'Story Map Title',
  subtitle: 'Story Map Subtitle',
  byline: 'by User',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
      media: { type: 'image/png', signedUrl: 'https://test.com/image.png' },
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    },
  ],
};

const setup = async () => {
  return await render(<StoryMap config={CONFIG} />);
};

const testChapter = ({ title, description, image }) => {
  const chapterSection = screen.getByRole('region', {
    name: `Chapter: ${title}`,
  });
  expect(
    within(chapterSection).getByRole('heading', { name: title, level: 3 })
  ).toBeInTheDocument();

  if (description) {
    expect(within(chapterSection).getByText(description)).toBeInTheDocument();
  }

  if (image) {
    const imageElement = within(chapterSection).getByRole('img', {
      name: 'Chapter media',
    });
    expect(imageElement).toHaveAttribute('src', image);
  }
};

test('StoryMap: Renders title and chapters correctly', async () => {
  await setup();

  // Title section
  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  expect(
    within(titleSection).getByRole('heading', { name: 'Story Map Title' })
  ).toBeInTheDocument();
  expect(
    within(titleSection).getByRole('heading', { name: 'Story Map Subtitle' })
  ).toBeInTheDocument();
  expect(within(titleSection).getByText('by User')).toBeInTheDocument();
  // Outline
  expect(
    within(titleSection).getByRole('link', { name: 'Chapter 1' })
  ).toBeInTheDocument();
  expect(
    within(titleSection).getByRole('link', { name: 'Chapter 2' })
  ).toBeInTheDocument();

  testChapter({
    title: 'Chapter 1',
    description: 'Chapter 1 description',
    image: 'https://test.com/image.png',
  });
  testChapter({ title: 'Chapter 2', description: 'Chapter 2 description' });
});

test('StoryMap: Use config style', async () => {
  await setup();

  expect(mapboxgl.Map).toHaveBeenCalledWith(
    expect.objectContaining({
      style: CONFIG.style,
    })
  );
});

test('StoryMap: the map is created exactly once across a config.style write (capture at mount)', async () => {
  const view = await setup();

  // VIEWER SEMANTICS: the map is created ONCE and captures `config.style` at
  // MOUNT (`useState(config.style)`). Live style changes are applied to the
  // LIVE map by the style switcher (`MapContext.changeStyle` keeps the
  // sources/layers) — a `config.style` write from anywhere else leaves the
  // rendered map diverged (logged) and must NOT recreate the map: recreation
  // would snap the camera and remount the layer stack. The editor behaves
  // the same (its style writes go through the style switcher's
  // `onMapStyleChange` → `updateStyle`).
  view.rerender(
    <StoryMap
      config={{ ...CONFIG, style: 'mapbox://styles/terraso/other-style' }}
    />
  );

  expect(mapboxgl.Map).toHaveBeenCalledTimes(1);
  expect(mapboxgl.Map).toHaveBeenCalledWith(
    expect.objectContaining({
      style: CONFIG.style,
    })
  );
});

test('StoryMap: map editing controls balance across rapid open/close (nav, geocoder, style switcher)', async () => {
  // The editor's Configure Chapter sidebar open/close drives exactly this
  // `mapEditing` prop (StoryMapForm passes `rightSidebar === CONFIGURE`).
  const onMapPositionChange = jest.fn();
  const onFitLayerBounds = jest.fn();
  // A LOADED map: controls attach as soon as the map context publishes the
  // instance (a real mapbox map is loaded by the time editing starts).
  mapboxgl.Map.mockReturnValue(createLoadedMapMock());
  const Harness = () => {
    const [mapEditing, setMapEditing] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setMapEditing(open => !open)}>
          toggle map editing
        </button>
        <StoryMap
          config={CONFIG}
          mapEditing={mapEditing}
          onMapPositionChange={onMapPositionChange}
          onFitLayerBounds={onFitLayerBounds}
        />
      </>
    );
  };
  await render(<Harness />);
  const map = mapboxgl.Map.mock.results[0].value;

  const addedControls = () =>
    map.addControl.mock.calls.map(([control]) => control);
  const removedControls = () =>
    map.removeControl.mock.calls.map(([control]) => control);
  const liveControls = () => {
    const removed = removedControls();
    return addedControls().filter(control => !removed.includes(control));
  };
  const isGeocoder = control => control instanceof MapboxGlGeocoder;
  const isNav = control => control instanceof mapboxgl.NavigationControl;
  const isStyleSwitcher = control => !isGeocoder(control) && !isNav(control);

  const expectOpenControls = () => {
    const live = liveControls();
    // Exactly one LIVE control per kind: rapid toggling never stacks.
    expect(live.filter(isGeocoder)).toHaveLength(1);
    expect(live.filter(isNav)).toHaveLength(1);
    expect(live.filter(isStyleSwitcher)).toHaveLength(1);
  };

  expectOpenControls();

  const toggle = screen.getByRole('button', { name: 'toggle map editing' });
  for (let cycle = 0; cycle < 3; cycle++) {
    // Close: every control is removed (balance for ALL controls).
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(liveControls()).toHaveLength(0);

    // Reopen: one of each again.
    await act(async () => {
      fireEvent.click(toggle);
    });
    expectOpenControls();
  }

  // Final close: all controls ever added were removed.
  await act(async () => {
    fireEvent.click(toggle);
  });
  expect(liveControls()).toHaveLength(0);
  addedControls().forEach(control => {
    expect(removedControls()).toContain(control);
  });
});

test('StoryMap: chapter content headings render below the chapter title level', async () => {
  await render(
    <StoryMap
      config={{
        ...CONFIG,
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            description: [
              {
                type: 'heading-one',
                children: [{ text: 'Content heading' }],
              },
            ],
          },
        ],
      }}
    />
  );

  const chapterSection = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  expect(
    within(chapterSection).getByRole('heading', { name: 'Chapter 1', level: 3 })
  ).toBeInTheDocument();
  expect(
    within(chapterSection).getByRole('heading', {
      name: 'Content heading',
      level: 4,
    })
  ).toBeInTheDocument();
});

test('StoryMap: applies story theme tokens across rendered content', async () => {
  await render(
    <StoryMap
      config={{
        ...CONFIG,
        themeId: 'theme-3',
        footer: 'Story footer',
      }}
    />
  );

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  const titleContent = titleSection.querySelector('.step-content');
  const chapterSection = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });
  const chapterContent = chapterSection.querySelector('.step-content');
  const footer = screen.getByText('Story footer').closest('#footer');
  const storyMap = document.getElementById('features')?.parentElement;

  expect(titleContent).toHaveClass('story-theme');
  expect(chapterContent).toHaveClass('story-theme');
  expect(footer).toHaveClass('story-theme');
  expect(storyMap).toHaveStyle('--story-theme-background: #52270B');
  expect(storyMap).toHaveStyle('--story-theme-text: #F4EDE0');
  expect(storyMap).toHaveStyle('--story-theme-link: #FEB98C');
  expect(storyMap).toHaveStyle('--story-theme-highlight: #7ED4C8');
});

test('StoryMap: falls back to the default story map theme when no theme is configured', async () => {
  await render(
    <StoryMap
      config={{
        ...CONFIG,
        themeId: undefined,
      }}
    />
  );

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  const storyMap = document.getElementById('features')?.parentElement;

  expect(storyMap).toHaveStyle('--story-theme-background: #00344D');
  expect(storyMap).toHaveStyle('--story-theme-text: #FFFFFF');
});

test('StoryMap: applies the new theme 8 tokens across rendered content', async () => {
  await render(
    <StoryMap
      config={{
        ...CONFIG,
        themeId: 'theme-8',
      }}
    />
  );

  const storyMap = document.getElementById('features')?.parentElement;

  expect(storyMap).toHaveStyle('--story-theme-background: #2B2B2B');
  expect(storyMap).toHaveStyle('--story-theme-text: #FFFFFF');
  expect(storyMap).toHaveStyle('--story-theme-link: #63D0F8');
  expect(storyMap).toHaveStyle('--story-theme-highlight: #FFE2A0');
});

const JUST_MODES_CONFIG = {
  style: 'mapbox://styles/terraso/test',
  title: 'Just Modes Story',
  subtitle: 'Just Modes Subtitle',
  byline: 'by User',
  chapters: [
    {
      id: 'map-only-chapter',
      title: 'Map Only',
      description: 'Map Only description',
      alignment: 'justMap',
    },
    {
      id: 'chapter-only-chapter',
      title: 'Chapter Only',
      description: 'Chapter Only description',
      alignment: 'justChapter',
      media: { type: 'image/png', signedUrl: 'https://test.com/only.png' },
    },
    {
      id: 'classic-left-chapter',
      title: 'Classic Left',
      description: 'Classic Left description',
      alignment: 'left',
    },
    {
      id: 'classic-center-chapter',
      title: 'Classic Center',
      description: 'Classic Center description',
      alignment: 'center',
    },
    {
      id: 'classic-right-chapter',
      title: 'Classic Right',
      description: 'Classic Right description',
      alignment: 'right',
    },
  ],
};

test('StoryMap: justMap chapter renders nothing over the map but keeps its scroll span', async () => {
  await render(<StoryMap config={JUST_MODES_CONFIG} />);

  const section = screen.getByRole('region', { name: 'Chapter: Map Only' });
  // No content, no background — just the map.
  expect(section).toBeEmptyDOMElement();
  expect(section.querySelector('.step-content')).toBeNull();
  expect(section).not.toHaveClass('story-theme');
  // Mode classes are asserted symmetrically for both just-modes (both or
  // neither — they are the CSS hooks for the shell rules in StoryMap.css).
  expect(section).toHaveClass('map-only');
  // The chapter still occupies its scroll space (100vh uncontained)…
  expect(section).toHaveStyle('min-height: 100vh');
  // …exactly one viewport: the classic card paddings do not stretch it.
  // The padding cancellation itself is a CSS rule (deterministic, next to
  // the paddings it cancels) — pinned by StoryMap.css.test.ts.
});

test('StoryMap: justMap chapter span is 100cqh when the story map is contained', async () => {
  await render(<StoryMap config={JUST_MODES_CONFIG} isContained />);

  const section = screen.getByRole('region', { name: 'Chapter: Map Only' });
  expect(section).toHaveStyle('min-height: 100cqh');
});

test('StoryMap: justChapter chapter is a full-span card covering the map, content centered', async () => {
  await render(<StoryMap config={JUST_MODES_CONFIG} />);

  const section = screen.getByRole('region', { name: 'Chapter: Chapter Only' });
  // Full-width background covering the map area for the chapter's span.
  expect(section).toHaveClass('chapter-only');
  expect(section).toHaveStyle('width: 100%');
  expect(section).toHaveStyle('min-height: 100vh');
  expect(section).toHaveStyle(
    'background-color: var(--story-theme-background)'
  );
  // Content vertically centered, horizontally centered with a max width.
  expect(section).toHaveStyle('justify-content: center');
  expect(section).toHaveStyle('align-items: center');
  // ONE owner of the cap value: the constant carries it to the CSS rule on
  // `.step-content` through the custom property (the rule consumes the var —
  // pinned by StoryMap.css.test.ts; the rule's `none` fallback keeps the
  // EDITOR card uncapped).
  expect(section).toHaveStyle(
    `${CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR}: ${CHAPTER_ONLY_CONTENT_MAX_WIDTH}`
  );
  const content = section.querySelector('.step-content');
  // The content itself renders normally.
  expect(
    within(section).getByRole('heading', { name: 'Chapter Only', level: 3 })
  ).toBeInTheDocument();
  expect(
    within(section).getByText('Chapter Only description')
  ).toBeInTheDocument();
  expect(
    within(section).getByRole('img', { name: 'Chapter media' })
  ).toBeInTheDocument();
  expect(content).toBeInTheDocument();
});

test('StoryMap: justChapter chapter span is 100cqh when the story map is contained', async () => {
  await render(<StoryMap config={JUST_MODES_CONFIG} isContained />);

  const section = screen.getByRole('region', { name: 'Chapter: Chapter Only' });
  expect(section).toHaveStyle('min-height: 100cqh');
});

test('StoryMap: left/center/right chapter rendering is unchanged', async () => {
  await render(<StoryMap config={JUST_MODES_CONFIG} />);

  const expectations = [
    ['Classic Left', 'lefty'],
    ['Classic Center', 'centered'],
    ['Classic Right', 'righty'],
  ];
  for (const [title, cssClass] of expectations) {
    const section = screen.getByRole('region', { name: `Chapter: ${title}` });
    expect(section).toHaveClass(cssClass);
    expect(
      within(section).getByText(`${title} description`)
    ).toBeInTheDocument();
    // No render-mode span on classic cards.
    expect(section).not.toHaveStyle('min-height: 100vh');
    expect(section).not.toHaveStyle('min-height: 100cqh');
  }
});

test('StoryMap: content-free just-mode beats keep their span through the consumers filter (K2)', async () => {
  // The consumers (UserStoryMap, UserStoryMapEmbed, StoryMapForm preview)
  // drop content-free chapters via `isChapterEmpty` — a bare-map beat (just
  // location + layer events) is the primary `justMap` use case and must keep
  // its span and its turn as the current step.
  await render(
    <StoryMap
      config={{
        ...JUST_MODES_CONFIG,
        chapters: [
          { id: 'empty-map', alignment: 'justMap' },
          { id: 'empty-chapter', alignment: 'justChapter' },
          { id: 'empty-classic', alignment: 'center' },
        ],
      }}
      chaptersFilter={chapter => !isChapterEmpty(chapter)}
    />
  );

  const mapBeat = document
    .getElementById('empty-map')
    .querySelector('.step-container');
  expect(mapBeat).toHaveClass('map-only');
  expect(mapBeat).toHaveStyle('min-height: 100vh');

  const chapterBeat = document
    .getElementById('empty-chapter')
    .querySelector('.step-container');
  expect(chapterBeat).toHaveClass('chapter-only');
  expect(chapterBeat).toHaveStyle('min-height: 100vh');

  // The classic content-free chapter is still dropped.
  expect(document.getElementById('empty-classic')).toBeNull();
});

test('StoryMap: the map opens at the first chapter whose camera will actually run (initialLocation fallback)', async () => {
  await render(
    <StoryMap
      config={{
        ...CONFIG,
        titleTransition: undefined,
        chapters: [
          {
            id: 'skipped-chapter',
            alignment: 'justChapter',
            // A justChapter chapter's recorded camera never plays (its step
            // transition is skipped) — not eligible as the initial camera.
            location: {
              center: { lng: 1, lat: 1 },
              zoom: 3,
              pitch: 0,
              bearing: 0,
              bounds: [0, 0, 2, 2],
            },
          },
          {
            id: 'map-beat',
            alignment: 'justMap',
            // justMap locations stay eligible.
            location: {
              center: { lng: 42, lat: 24 },
              zoom: 5,
              pitch: 0,
              bearing: 0,
              bounds: [40, 20, 44, 28],
            },
          },
        ],
      }}
    />
  );

  expect(mapboxgl.Map).toHaveBeenCalledWith(
    expect.objectContaining({ center: { lng: 42, lat: 24 }, zoom: 5 })
  );
  expect(mapboxgl.Map).not.toHaveBeenCalledWith(
    expect.objectContaining({ center: { lng: 1, lat: 1 } })
  );
});

// --- transition wiring --------------------------------------------------
//
// startTransition only runs when the map has dimensions (the ResizeObserver
// reports them). setupTests' stub never fires, so tests that observe its
// output install a firing one and use a LOADED map mock (the map instance is
// published on `load`).

const withFiringResizeObserver = () => {
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([
        { contentBoxSize: [{ blockSize: 600, inlineSize: 1200 }] },
      ]);
    }
    unobserve() {}
    disconnect() {}
  };
  return () => {
    globalThis.ResizeObserver = original;
  };
};

// A LOADED map mock whose referenced layers all exist on the map (as circle
// layers) — startLayerTransition only paints layers the map reports.
const createWiringMap = () =>
  createLoadedMapMock({
    getLayer: jest.fn(() => ({ type: 'circle' })),
  });

const withMatchMedia = matches => {
  const original = window.matchMedia;
  window.matchMedia = query => ({
    media: query,
    matches,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
  return () => {
    window.matchMedia = original;
  };
};

const WIRING_CONFIG = {
  style: 'mapbox://styles/terraso/test',
  title: 'Wiring Story',
  subtitle: 'Wiring Subtitle',
  byline: 'by User',
  dataLayers: {
    a: { id: 'a', title: 'A', geojsonSignedUrl: 'https://test.com/a.geojson' },
  },
  chapters: [
    // The content-free bare-map beat (K2): location + layers only.
    {
      id: 'empty-map',
      alignment: 'justMap',
      location: {
        center: { lng: -79.9, lat: -2.4 },
        zoom: 5,
        pitch: 0,
        bearing: 0,
        bounds: [-80, -3, -79, -2],
      },
    },
    {
      id: 'chapter-only-chapter',
      title: 'Chapter Only',
      description: 'Chapter Only description',
      alignment: 'justChapter',
      location: {
        center: { lng: -79.9, lat: -2.4 },
        zoom: 5,
        pitch: 0,
        bearing: 0,
        bounds: [-80, -3, -79, -2],
      },
      onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
    },
  ],
};

describe('StoryMap: transition wiring (layers / camera at the component level)', () => {
  test('allowLayerForcing wiring: concealed while viewing, configurable while the map is being positioned', async () => {
    const restore = withFiringResizeObserver();
    mapboxgl.Map.mockReturnValue(createWiringMap());
    const view = await render(
      <StoryMap config={WIRING_CONFIG} activeStepId="chapter-only-chapter" />
    );
    const map = mapboxgl.Map.mock.results[0].value;

    // Viewing (and the editor's non-configuring preview): the display
    // override conceals every layer while the justChapter chapter is active
    // (`allowLayerForcing={!mapEditing}` — an INVERTED prop fails here).
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      0
    );

    map.setPaintProperty.mockClear();
    view.rerender(
      <StoryMap
        config={WIRING_CONFIG}
        activeStepId="chapter-only-chapter"
        mapEditing
      />
    );
    // The configuring session keeps layers visible and configurable.
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
    restore();
  });

  test('a content-free justMap beat runs its camera transition (K2 end-to-end)', async () => {
    const restore = withFiringResizeObserver();
    mapboxgl.Map.mockReturnValue(createWiringMap());
    await render(<StoryMap config={WIRING_CONFIG} activeStepId="empty-map" />);
    const map = mapboxgl.Map.mock.results[0].value;

    expect(map.flyTo).toHaveBeenCalled();
    restore();
  });

  test('hidden wins: a hidden justChapter chapter performs NO mode semantics', async () => {
    const restore = withFiringResizeObserver();
    mapboxgl.Map.mockReturnValue(createWiringMap());
    await render(
      <StoryMap
        config={{
          ...WIRING_CONFIG,
          chapters: [
            {
              ...WIRING_CONFIG.chapters[1],
              id: 'hidden-chapter',
              hidden: true,
            },
          ],
        }}
        activeStepId="hidden-chapter"
      />
    );
    const map = mapboxgl.Map.mock.results[0].value;

    // No camera skip…
    expect(map.flyTo).toHaveBeenCalled();
    // …and no layer forcing (the authored event applies).
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
    restore();
  });

  test('xs: the just-modes degrade to center semantics (normal card, layers visible, camera runs)', async () => {
    const restoreResize = withFiringResizeObserver();
    const restoreMatchMedia = withMatchMedia(true);
    mapboxgl.Map.mockReturnValue(createWiringMap());
    await render(
      <StoryMap config={WIRING_CONFIG} activeStepId="chapter-only-chapter" />
    );
    const map = mapboxgl.Map.mock.results[0].value;

    // Normal card rendering: the content is shown, the mode shell is gone.
    const section = document
      .getElementById('chapter-only-chapter')
      .querySelector('.step-container');
    expect(section).not.toHaveClass('chapter-only');
    expect(section).toHaveClass('centered');
    expect(section).not.toHaveStyle('min-height: 100vh');
    expect(
      within(section).getByRole('heading', { name: 'Chapter Only', level: 3 })
    ).toBeInTheDocument();

    // The map is a visible band on xs: camera runs, layers are not forced.
    expect(map.flyTo).toHaveBeenCalled();
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
    restoreResize();
    restoreMatchMedia();
  });
});
