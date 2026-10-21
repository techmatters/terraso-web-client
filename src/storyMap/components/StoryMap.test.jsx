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

// Mock mapboxgl
jest.mock('terraso-web-client/gis/mapbox', () => ({}));

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
