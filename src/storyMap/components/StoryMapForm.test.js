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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import React from 'react';
import { when } from 'jest-when';
import scrollama from 'scrollama';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { useAnalytics } from 'monitoring/analytics';
import mapboxgl from 'gis/mapbox';
import {
  TILESET_STATUS_PENDING,
  TILESET_STATUS_READY,
} from 'sharedData/sharedDataConstants';

import StoryMapForm from './StoryMapForm';
import { StoryMapConfigContextProvider } from './StoryMapForm/storyMapConfigContext';

// Mock mapboxgl
jest.mock('gis/mapbox', () => ({}));

// Scrollama mock
jest.mock('scrollama', () => jest.fn());

// TODO test RichTextEditor
// Right now there is no way to test it, see: https://github.com/ianstormtaylor/slate/issues/4902
jest.mock('common/components/RichTextEditor', () => props => {
  return (
    <input
      type="text"
      aria-label={props.label}
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
    />
  );
});

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

jest.mock('gis/components/MapStyleSwitcher', () => ({
  __esModule: true,
  default: ({ onStyleChange }) => (
    <button
      onClick={() =>
        onStyleChange({
          newStyle: { data: 'newStyle' },
          confirmChangeStyle: () => {},
        })
      }
    >
      Change Style
    </button>
  ),
}));

jest.mock('terraso-client-shared/terrasoApi/api');

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: jest.fn(),
});

const MEDIA_TEST_CONFIGS = {
  image: { type: 'image/png', signedUrl: 'https://test.com/image.png' },
  audio: {
    type: 'audio/mp3',
    signedUrl: 'https://test.com/audio.mp3',
    filename: 'audio.mp3',
  },
  video: {
    type: 'video/mp4',
    signedUrl: 'https://test.com/video.mp4',
    filename: 'video.mp4',
  },
  embedded: {
    type: 'embedded',
    url: 'https://www.youtube.com/embed/test123',
    title: 'Test Video',
  },
};

const VISUALIZATION_CONFIG_JSON = {
  datasetConfig: {
    dataColumns: { option: '', selectedColumns: ['', '', ''] },
  },
  annotateConfig: { dataPoints: [] },
  viewportConfig: {
    bounds: {
      northEast: { lat: -0.001761313889005578, lng: -77.90754677404158 },
      southWest: { lat: -0.34553971461512845, lng: -79.07181671821586 },
    },
  },
  visualizeConfig: {
    size: 15,
    color: '#FF580D',
    shape: 'circle',
    opacity: 50,
  },
};

const VISUALIZATION_CONFIG = {
  id: 'ac0853a2-99e4-4794-93ca-aafc89f361b6',
  title: 'Datalayer title 1',
  description: 'Visualization description',
  slug: 'map-title-1',
  createdAt: '2024-01-10T15:36:11.684190+00:00',
  createdBy: {
    id: '9de58095-749a-4d62-b6e0-d0b6034d8949',
    lastName: '',
    firstName: 'Jose',
  },
  mapboxTilesetId: 'ac0853a299e4479493caaafc89f361b6',
  mapboxTilesetStatus: TILESET_STATUS_READY,
  configuration: JSON.stringify(VISUALIZATION_CONFIG_JSON),
  dataEntry: {
    name: 'Data Entry Name',
    resourceType: 'geojson',
    createdBy: {
      lastName: 'Paez',
      firstName: 'Maria',
    },
    sharedResources: {
      edges: [
        {
          node: {
            target: {
              name: 'Private 1',
              membershipList: {
                membershipType: 'CLOSED',
              },
            },
          },
        },
      ],
    },
  },
};

const VISUALIZATION_CONFIG_PROCESSING = {
  ...VISUALIZATION_CONFIG,
  mapboxTilesetId: 'a6d0f54afefb4f83ad388f9f6723a1aa',
  mapboxTilesetStatus: TILESET_STATUS_PENDING,
  id: '0f9cd329-ded8-4984-a8fd-5cb19c465382',
  title: 'Datalayer title 2',
};

const VISUALIZATION_CONFIG_NO_TILESET = {
  ...VISUALIZATION_CONFIG,
  mapboxTilesetId: null,
  mapboxTilesetStatus: TILESET_STATUS_PENDING,
  id: '0f9cd329-ded8-4984-a8fd-5cb19c465382',
  title: 'Datalayer title 3',
};

const expectSave = async () => {
  const header = screen.getByRole('region', { name: 'Story editor Header' });
  expect(within(header).getByText('Saving…')).toBeInTheDocument();
  await waitFor(() => {
    expect(within(header).getByText('Draft saved')).toBeInTheDocument();
  });
};

const getChapterRegion = chapterName =>
  screen.getByRole('region', { name: `Chapter: ${chapterName}` });

const openMediaDialog = async chapterName => {
  const chapter = getChapterRegion(chapterName);
  const mediaButton = within(chapter).getByRole('button', {
    name: 'Add media',
  });
  await act(async () => fireEvent.click(mediaButton));
  return screen.getByRole('dialog', { name: 'Add media' });
};

const setMediaElementProperties = (element, properties) => {
  Object.keys(properties).forEach(key => {
    if (element[key] !== undefined) {
      delete element[key];
    }
    Object.defineProperty(element, key, {
      value: properties[key],
      configurable: true,
    });
  });
};

const baseMapOptions = () => ({
  onEvents: {},
  on: function (type, cb) {
    if (type === 'load') {
      cb();
    }
    this.onEvents[type] = cb;
  },
  remove: jest.fn(),
  off: jest.fn(),
  getCanvas: jest.fn(),
  addControl: jest.fn(),
  removeControl: jest.fn(),
  getCenter: jest.fn(),
  getZoom: jest.fn(),
  addSource: jest.fn(),
  getSource: jest.fn(),
  setTerrain: jest.fn(),
  addLayer: jest.fn(),
  getLayer: jest.fn(),
  flyTo: jest.fn(),
  getBounds: jest.fn(),
  getStyle: jest.fn(),
  fitBounds: jest.fn(),
});

const BASE_CONFIG = {
  title: 'Story Map Title',
  subtitle: 'Story Map Subtitle',
  byline: 'by User',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
      media: { type: 'image/png', signedUrl: 'https://test.com/image.png' },
      onChapterEnter: [
        {
          layer: 'layer1',
          opacity: 1,
          duration: 0,
        },
      ],
      onChapterExit: [
        {
          layer: 'layer1',
          opacity: 0,
          duration: 0,
        },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
      location: {
        center: { lng: -79.89928261750599, lat: -2.423124847733348 },
        zoom: 5,
      },
      dataLayerConfigId: 'ac0853a2-99e4-4794-93ca-aafc89f361b6',
      onChapterEnter: [
        {
          layer: 'layer1',
          opacity: 1,
          duration: 0,
        },
      ],
      onChapterExit: [
        {
          layer: 'layer1',
          opacity: 0,
          duration: 0,
        },
      ],
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3',
      description: 'Chapter 3 description',
      dataLayerConfigId: 'ac0853a2-99e4-4794-93ca-aafc89f361b6',
      onChapterEnter: [
        {
          layer: 'layer1',
          opacity: 1,
          duration: 0,
        },
      ],
      onChapterExit: [
        {
          layer: 'layer1',
          opacity: 0,
          duration: 0,
        },
      ],
    },
  ],
};

beforeEach(() => {
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.LngLatBounds.prototype = {
    isEmpty: jest.fn().mockReturnValue(false),
  };
  mapboxgl.LngLat = jest.fn();
  mapboxgl.Popup = jest.fn();
  const Popup = {
    setLngLat: jest.fn().mockReturnThis(),
    setMaxWidth: jest.fn().mockReturnThis(),
    setDOMContent: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  };
  mapboxgl.Popup.mockReturnValue(Popup);
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.mockReturnValue(baseMapOptions());
  window.HTMLElement.prototype.scrollIntoView = jest.fn();

  const scroller = {
    setup: function () {
      return this;
    },
    onStepEnter: function (cb) {
      this.stepEnter = cb;
      return this;
    },
    onStepExit: function (cb) {
      this.stepExit = cb;
      return this;
    },
    resize: jest.fn(),
    destroy: jest.fn(),
  };
  scrollama.mockImplementation(() => scroller);
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
  when(terrasoApi.requestGraphQL)
    .calledWith(expect.stringContaining('query visualizationConfigs'))
    .mockResolvedValue({
      visualizationConfigs: {
        edges: [
          {
            node: VISUALIZATION_CONFIG,
          },
          {
            node: VISUALIZATION_CONFIG_PROCESSING,
          },
          {
            node: VISUALIZATION_CONFIG_NO_TILESET,
          },
        ],
      },
    });
});

const setup = async ({ config, autoSaveDebounce = 1500 }) => {
  const onPublish = jest.fn().mockImplementation(() => Promise.resolve());
  const onSaveDraft = jest.fn().mockImplementation(() => Promise.resolve());

  await render(
    <StoryMapConfigContextProvider
      baseConfig={config}
      autoSaveDebounce={autoSaveDebounce}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      <StoryMapForm onPublish={onPublish} onSaveDraft={onSaveDraft} />
    </StoryMapConfigContextProvider>
  );

  return {
    onPublish,
    onSaveDraft,
  };
};

const testChapter = ({ title, description, image }) => {
  const chapterSection = screen.getByRole('region', {
    name: `Chapter: ${title}`,
  });
  expect(
    within(chapterSection).getByRole('heading', { name: title })
  ).toBeInTheDocument();

  if (description) {
    const descriptionTextbox = within(chapterSection).getByRole('textbox', {
      name: 'Chapter description',
    });
    expect(descriptionTextbox).toHaveValue(description);
  }

  if (image) {
    const imageElement = within(chapterSection).getByRole('img', {
      name: 'Chapter media',
    });
    expect(imageElement).toHaveAttribute('src', image);
  }
};

const changeChaper = async ({
  title,
  newTitle,
  newDescription,
  newFile,
  newEmbed,
}) => {
  const chapterSection = screen.getByRole('region', {
    name: `Chapter: ${title}`,
  });
  if (newTitle) {
    const titleTextbox = within(chapterSection).getByRole('textbox', {
      name: 'Chapter title',
    });
    await act(async () =>
      fireEvent.change(titleTextbox, { target: { value: newTitle } })
    );
  }

  if (newDescription) {
    const descriptionTextbox = within(chapterSection).getByRole('textbox', {
      name: 'Chapter description',
    });
    await act(async () =>
      fireEvent.change(descriptionTextbox, {
        target: { value: newDescription },
      })
    );
  }

  if (newFile) {
    const mediaButton = within(chapterSection).getByRole('button', {
      name: 'Add media',
    });
    await act(async () => fireEvent.click(mediaButton));

    const mediaDialog = screen.getByRole('dialog', {
      name: 'Add media',
    });
    const dropZone = within(mediaDialog).getByRole('button', {
      name: 'Upload a photo or audio file Select File Accepted file formats: *.aac, *.gif, *.jpeg, *.jpg, *.mp3, *.mp4, *.png, *.wav Maximum file size: 10 MB',
    });
    const data = {
      dataTransfer: {
        files: [newFile],
        items: [
          {
            kind: 'file',
            type: newFile.type,
            getAsFile: () => newFile,
          },
        ],
        types: ['Files'],
      },
    };
    await act(async () => fireEvent.drop(dropZone, data));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Add media' })
      ).not.toHaveAttribute('disabled')
    );

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Add media' }))
    );
  }

  if (newEmbed) {
    const mediaButton = within(chapterSection).getByRole('button', {
      name: 'Add media',
    });
    await act(async () => fireEvent.click(mediaButton));

    const mediaDialog = screen.getByRole('dialog', {
      name: 'Add media',
    });
    const embedInput = within(mediaDialog).getByRole('textbox', {
      name: 'Link to a YouTube or Vimeo video',
    });

    await act(async () =>
      fireEvent.change(embedInput, { target: { value: newEmbed } })
    );

    await act(async () =>
      fireEvent.blur(embedInput, { target: { value: newEmbed } })
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Add media' })
      ).not.toHaveAttribute('disabled')
    );

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Add media' }))
    );
  }
};

test('StoryMapForm: Renders title and chapters correctly', async () => {
  await setup({ config: BASE_CONFIG });

  // Editor header
  const header = screen.getByRole('region', {
    name: 'Story editor Header',
  });
  expect(
    within(header).getByRole('heading', { name: 'Story Map Title' })
  ).toBeInTheDocument();

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

test('StoryMapForm: Change title', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });

  // Title
  await act(async () =>
    fireEvent.click(
      within(titleSection).getByRole('heading', { name: 'Story Map Title' })
    )
  );
  await act(async () =>
    fireEvent.change(
      within(titleSection).getByRole('textbox', {
        name: 'Story map title (Required)',
      }),
      { target: { value: 'New title' } }
    )
  );

  // Subtitle
  await act(async () =>
    fireEvent.click(
      within(titleSection).getByRole('heading', { name: 'Story Map Subtitle' })
    )
  );
  await act(async () =>
    fireEvent.change(
      within(titleSection).getByRole('textbox', { name: 'Story map subtitle' }),
      { target: { value: 'New subtitle' } }
    )
  );

  // Byline
  await act(async () =>
    fireEvent.click(within(titleSection).getByText('by User'))
  );
  await act(async () =>
    fireEvent.change(
      within(titleSection).getByRole('textbox', { name: 'Byline' }),
      { target: { value: 'by Other' } }
    )
  );

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0]).toEqual(
    expect.objectContaining({
      title: 'New title',
      subtitle: 'New subtitle',
      byline: 'by Other',
    })
  );
});

test('StoryMapForm: Sidebar navigation', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -99.91122777353772, lat: 21.64458705609789 }),
  };
  mapboxgl.Map.mockReturnValue(map);
  const scroller = {
    setup: function () {
      return this;
    },
    onStepEnter: function (cb) {
      this.stepEnter = cb;
      return this;
    },
    onStepExit: function (cb) {
      this.stepExit = cb;
      return this;
    },
    resize: jest.fn(),
    destroy: jest.fn(),
  };
  scrollama.mockImplementation(() => scroller);

  await setup({ config: BASE_CONFIG });

  // Get sidebar list
  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  const title = within(sidebarList).getByRole('button', {
    name: 'Title',
  });

  await waitFor(() => {
    expect(
      within(sidebarList).getByRole('button', {
        name: 'Chapter 1',
      })
    ).toBeInTheDocument();
  });

  const chapter1 = within(sidebarList).getByRole('button', {
    name: 'Chapter 1',
  });
  const chapter2 = within(sidebarList).getByRole('button', {
    name: 'Chapter 2',
  });

  await waitFor(() => expect(scrollama).toHaveBeenCalled());

  // Trigger on chapter 1
  await act(async () => {
    scroller.stepEnter({
      element: document.querySelector('#chapter-1'),
    });
  });
  expect(chapter1).toHaveAttribute('aria-current', 'step');
  expect(chapter2).not.toHaveAttribute('aria-current', 'step');
  expect(title).not.toHaveAttribute('aria-current', 'step');

  expect(map.flyTo).toHaveBeenCalledTimes(0);

  // Trigger on chapter 2
  await act(async () => {
    scroller.stepEnter({
      element: document.querySelector('#chapter-2'),
    });
  });
  expect(chapter1).not.toHaveAttribute('aria-current', 'step');
  expect(chapter2).toHaveAttribute('aria-current', 'step');
  expect(title).not.toHaveAttribute('aria-current', 'step');

  expect(map.flyTo).toHaveBeenCalledTimes(1);

  // Trigger on title
  await act(async () => {
    scroller.stepEnter({
      element: document.querySelector('#story-map-title'),
    });
  });
  expect(title).toHaveAttribute('aria-current', 'step');
  expect(chapter1).not.toHaveAttribute('aria-current', 'step');
  expect(chapter2).not.toHaveAttribute('aria-current', 'step');
});

test('StoryMapForm: Adds new chapter', async () => {
  const { onSaveDraft } = await setup({
    config: BASE_CONFIG,
    autoSaveDebounce: 1000,
  });

  // Add new chapter
  const addChapterButton = screen.getByRole('button', {
    name: 'Add new chapter',
  });
  await act(async () => fireEvent.click(addChapterButton));

  // New chapter should be added
  const newChapter = screen.getByRole('region', {
    name: 'Chapter: Untitled',
  });
  expect(newChapter).toBeInTheDocument();

  await expectSave();
  expect(onSaveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Story Map Title',
      subtitle: 'Story Map Subtitle',
      byline: 'by User',
    }),
    expect.anything()
  );

  // Change title and description
  await changeChaper({
    title: 'Untitled',
    newTitle: 'New chapter',
    newDescription: 'New chapter description',
    newFile: new File(['content2'], `test.jpg`, {
      type: `image/jpeg`,
    }),
  });

  expect(onSaveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      chapters: expect.arrayContaining([
        expect.objectContaining({
          id: 'chapter-1',
          title: 'Chapter 1',
          description: 'Chapter 1 description',
          media: {
            type: 'image/png',
            signedUrl: 'https://test.com/image.png',
          },
        }),
      ]),
    }),
    expect.anything()
  );
});
test('StoryMapForm: Add embedded media', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  await changeChaper({
    title: 'Chapter 2',
    newEmbed: 'https://youtu.be/n_uFzLPYDd8',
  });

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].chapters[1].media).toEqual(
    expect.objectContaining({
      source: 'youtube',
      type: 'embedded',
      url: 'https://www.youtube.com/embed/n_uFzLPYDd8',
    })
  );
});
test('StoryMapForm: Add audio media', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  await changeChaper({
    title: 'Chapter 2',
    newFile: new File(['content2'], `test.jpg`, {
      type: `audio/mp3`,
    }),
  });

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].chapters[1].media).toEqual(
    expect.objectContaining({
      filename: 'test.jpg',
      type: 'audio/mp3',
    })
  );

  expect(saveCall[0].chapters[1].media.contentId).toEqual(
    Object.keys(saveCall[1])[0]
  );
});
test('StoryMapForm: Show preview', async () => {
  await setup({ config: BASE_CONFIG });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('menuitem', { name: 'Preview draft' }))
  );

  const chapters = screen.getByRole('region', {
    name: 'Chapters',
  });

  expect(
    within(chapters).getByRole('region', { name: 'Title for: Story Map Title' })
  ).toBeInTheDocument();
  expect(
    within(chapters).getByRole('region', { name: 'Chapter: Chapter 1' })
  ).toBeInTheDocument();
  expect(
    within(chapters).getByRole('region', { name: 'Chapter: Chapter 2' })
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Exit Preview' }))
  );
});
test('StoryMapForm: Change chapter location', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -78.54414857836304, lat: -0.2294635049867253 }),
    getZoom: () => 10,
    getPitch: () => 64,
    getBearing: () => 45,
  };
  mapboxgl.Map.mockReturnValue(map);
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chapter1 = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  const locationDialogButton = within(chapter1).getByRole('button', {
    name: 'Edit Map',
  });
  await act(async () => fireEvent.click(locationDialogButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Set map location for Chapter 1',
  });

  await act(async () => map.onEvents['move']());

  await act(async () =>
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Map' }))
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].chapters[0]).toEqual(
    expect.objectContaining({
      location: {
        bearing: 45,
        center: {
          lat: -0.2294635049867253,
          lng: -78.54414857836304,
        },
        pitch: 64,
        zoom: 10,
      },
    })
  );
});

test('StoryMapForm: Change chapter style', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -78.54414857836304, lat: -0.2294635049867253 }),
    getZoom: () => 10,
    getPitch: () => 64,
    getBearing: () => 45,
  };
  mapboxgl.Map.mockReturnValue(map);
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chapter1 = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  const locationDialogButton = within(chapter1).getByRole('button', {
    name: 'Edit Map',
  });
  await act(async () => fireEvent.click(locationDialogButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Set map location for Chapter 1',
  });

  const baseMapButton = within(dialog).getByRole('button', {
    name: 'Change Style',
  });

  await act(async () => fireEvent.click(baseMapButton));

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Save Map' })
    ).toBeInTheDocument();
  });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Map' }))
  );

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].style).toEqual('newStyle');
});

test('StoryMapForm: Add map layer', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -78.54414857836304, lat: -0.2294635049867253 }),
    getZoom: () => 10,
    getPitch: () => 64,
    getBearing: () => 45,
  };
  mapboxgl.Map.mockReturnValue(map);

  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chapter1 = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  const locationDialogButton = within(chapter1).getByRole('button', {
    name: 'Edit Map',
  });
  await act(async () => fireEvent.click(locationDialogButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Set map location for Chapter 1',
  });

  const addDataLayerButton = within(dialog).getByRole('button', {
    name: 'Add Map Layer',
  });
  await act(async () => fireEvent.click(addDataLayerButton));

  const dataMapDialog = screen.getByRole('dialog', {
    name: 'Add a map layer to Chapter 1',
  });

  const dataLayerItem = within(dataMapDialog).getByRole('listitem', {
    name: 'Datalayer title 1',
  });
  const dataLayerItemProcessing = within(dataMapDialog).getByRole('listitem', {
    name: 'Datalayer title 2',
  });
  const dataLayerItemNoTileset = within(dataMapDialog).queryByRole('listitem', {
    name: 'Datalayer title 3',
  });
  expect(
    within(dataLayerItemProcessing).getByText('Processing')
  ).toBeInTheDocument();
  expect(dataLayerItemNoTileset).not.toBeInTheDocument();

  const radioButton = within(dataLayerItem).getByRole('radio');
  await act(async () => fireEvent.click(radioButton));

  const addMapButton = within(dataMapDialog).getByRole('button', {
    name: 'Add Map Layer',
  });
  await act(async () => fireEvent.click(addMapButton));

  await waitFor(() => {
    expect(
      within(dialog).getByRole('button', { name: 'Save Map' })
    ).toBeInTheDocument();
  });
  const saveMapButton = within(dialog).getByRole('button', {
    name: 'Save Map',
  });
  await act(async () => fireEvent.click(saveMapButton));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  // Save
  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      chapters: expect.arrayContaining([
        expect.objectContaining({
          dataLayerConfigId: 'ac0853a2-99e4-4794-93ca-aafc89f361b6',
        }),
      ]),
      dataLayers: {
        'ac0853a2-99e4-4794-93ca-aafc89f361b6': expect.objectContaining({
          visualizeConfig: expect.anything(),
          mapboxTilesetId: expect.anything(),
          dataEntry: expect.anything(),
        }),
      },
    }),
    expect.anything()
  );
});

test('StoryMapForm: Move chapter down with menu', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chaptersSection = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  await waitFor(() =>
    expect(
      within(chaptersSection).getByRole('button', {
        name: 'Chapter 1',
      })
    ).toBeInTheDocument()
  );

  const chapter1 = within(chaptersSection).getByRole('button', {
    name: 'Chapter 1',
  });

  const menuButton = within(chapter1).getByRole('button', {
    name: 'More options',
  });
  await act(async () => fireEvent.click(menuButton));

  const menu = screen.getByRole('menu', {
    name: 'Chapter 1 menu',
  });

  const moveDownButton = within(menu).getByRole('menuitem', {
    name: 'Move Chapter Down',
  });

  await act(async () => fireEvent.click(moveDownButton));

  await waitFor(() =>
    expect(
      screen.queryByRole('button', {
        name: 'Dragging Chapter 1',
      })
    ).not.toBeInTheDocument()
  );

  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];

  expect(saveCall[0].chapters[0]).toEqual(
    expect.objectContaining({
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    })
  );
  expect(saveCall[0].chapters[1]).toEqual(
    expect.objectContaining({
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
    })
  );

  expect(trackEvent).toHaveBeenCalledWith('storymap.chapter.move', {
    props: {
      distance: 1,
      map: 'story-map-id-1',
    },
  });
});

test('StoryMapForm: Move chapter up with menu', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chaptersSection = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  await waitFor(() => {
    expect(
      within(chaptersSection).getByRole('button', {
        name: 'Chapter 2',
      })
    ).toBeInTheDocument();
  });
  const chapter2 = within(chaptersSection).getByRole('button', {
    name: 'Chapter 2',
  });

  const menuButton = within(chapter2).getByRole('button', {
    name: 'More options',
  });
  await act(async () => fireEvent.click(menuButton));

  const menu = screen.getByRole('menu', {
    name: 'Chapter 2 menu',
  });

  const moveUpButton = within(menu).getByRole('menuitem', {
    name: 'Move Chapter Up',
  });

  await act(async () => fireEvent.click(moveUpButton));

  expect(
    screen.getByRole('button', {
      name: 'Dragging Chapter 2',
    })
  ).toBeInTheDocument();

  await waitFor(() =>
    expect(
      screen.queryByRole('button', {
        name: 'Dragging Chapter 2',
      })
    ).not.toBeInTheDocument()
  );

  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];

  expect(saveCall[0].chapters[0]).toEqual(
    expect.objectContaining({
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    })
  );
  expect(saveCall[0].chapters[1]).toEqual(
    expect.objectContaining({
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
    })
  );
});

test('StoryMapForm: Show correct sort buttons if chapter is first', async () => {
  await setup({ config: BASE_CONFIG });

  const chaptersSection = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  await waitFor(() => {
    expect(
      within(chaptersSection).getByRole('button', {
        name: 'Chapter 1',
      })
    ).toBeInTheDocument();
  });

  const chapter1 = within(chaptersSection).getByRole('button', {
    name: 'Chapter 1',
  });
  const menuButton = within(chapter1).getByRole('button', {
    name: 'More options',
  });
  await act(async () => fireEvent.click(menuButton));
  const menu = screen.getByRole('menu', {
    name: 'Chapter 1 menu',
  });
  const moveUpButton = within(menu).queryByRole('menuitem', {
    name: 'Move Chapter Up',
  });

  expect(moveUpButton).not.toBeInTheDocument();
});

test('StoryMapForm: Show correct sort buttons if chapter is last', async () => {
  await setup({ config: BASE_CONFIG });

  const chaptersSection = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  const chapter3 = within(chaptersSection).getByRole('button', {
    name: 'Chapter 3',
  });
  const menuButton = within(chapter3).getByRole('button', {
    name: 'More options',
  });
  await act(async () => fireEvent.click(menuButton));
  const menu = screen.getByRole('menu', {
    name: 'Chapter 3 menu',
  });
  const moveDownButton = within(menu).queryByRole('menuitem', {
    name: 'Move Chapter Down',
  });

  expect(moveDownButton).not.toBeInTheDocument();
});

test('StoryMapForm: Delete chapter', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  const chaptersSection = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  await waitFor(() => {
    expect(
      within(chaptersSection).getByRole('button', {
        name: 'Chapter 1',
      })
    ).toBeInTheDocument();
  });

  const chapter1 = within(chaptersSection).getByRole('button', {
    name: 'Chapter 1',
  });
  const menuButton = within(chapter1).getByRole('button', {
    name: 'More options',
  });
  await act(async () => fireEvent.click(menuButton));
  const menu = screen.getByRole('menu', {
    name: 'Chapter 1 menu',
  });
  const deleteButton = within(menu).getByRole('menuitem', {
    name: 'Delete Chapter',
  });

  await act(async () => fireEvent.click(deleteButton));

  // Confirmation dialog
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Delete Chapter' }))
  );

  // Wait for delete animation
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  await expectSave();
  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];

  expect(saveCall[0].chapters.length).toEqual(2);
  expect(saveCall[0].chapters[0]).toEqual(
    expect.objectContaining({
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    })
  );
  expect(saveCall[0].chapters[1]).toEqual(
    expect.objectContaining({
      id: 'chapter-3',
      title: 'Chapter 3',
      description: 'Chapter 3 description',
    })
  );
});

test('StoryMapForm: Keep map on chapter change', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -99.91122777353772, lat: 21.64458705609789 }),
    getStyle: () => 'has style',
    getLayer: () => ({ type: 'fill' }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
  };
  mapboxgl.Map.mockReturnValue(map);
  const scroller = {
    setup: function () {
      return this;
    },
    onStepEnter: function (cb) {
      this.stepEnter = cb;
      return this;
    },
    onStepExit: function (cb) {
      this.stepExit = cb;
      return this;
    },
    resize: jest.fn(),
    destroy: jest.fn(),
  };
  scrollama.mockImplementation(() => scroller);

  await setup({ config: BASE_CONFIG });

  await waitFor(() => expect(scrollama).toHaveBeenCalled());

  // Go to chapter 1
  await act(async () =>
    scroller.stepEnter({
      element: document.querySelector('#chapter-1'),
    })
  );

  // Go to chapter 2
  await act(async () =>
    scroller.stepEnter({
      element: document.querySelector('#chapter-2'),
      direction: 'down',
    })
  );
  await act(async () =>
    scroller.stepExit({
      element: document.querySelector('#chapter-1'),
      direction: 'down',
    })
  );
  await expect(map.setPaintProperty).toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    1,
    {}
  );
  await expect(map.setPaintProperty).not.toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    0,
    {}
  );

  // Go to chapter 1
  await act(async () =>
    scroller.stepEnter({
      element: document.querySelector('#chapter-1'),
      direction: 'up',
    })
  );
  await act(async () =>
    scroller.stepExit({
      element: document.querySelector('#chapter-2'),
      direction: 'up',
    })
  );
  await expect(map.setPaintProperty).toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    1,
    {}
  );
  await expect(map.setPaintProperty).not.toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    0,
    {}
  );
});

describe('StoryMapForm: EditableMedia Component', () => {
  test('Dynamic height management for images', async () => {
    await setup({ config: BASE_CONFIG });

    const chapter1 = getChapterRegion('Chapter 1');
    const imageElement = within(chapter1).getByRole('img', {
      name: 'Chapter media',
    });

    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', 'https://test.com/image.png');
    expect(imageElement).toHaveAttribute('loading', 'lazy');

    await act(async () => {
      setMediaElementProperties(imageElement, {
        naturalWidth: 800,
        naturalHeight: 600,
        offsetWidth: 400,
      });
      fireEvent.load(imageElement);
    });

    const imageContainer =
      imageElement.closest('[role="img"]')?.parentElement ||
      imageElement.parentElement;
    expect(imageContainer).toHaveStyle('position: relative');
  });

  test('Error handling for failed media loading', async () => {
    await setup({ config: BASE_CONFIG });

    const chapter1 = getChapterRegion('Chapter 1');
    const imageElement = within(chapter1).getByRole('img', {
      name: 'Chapter media',
    });

    await act(async () => {
      fireEvent.error(imageElement);
    });

    expect(
      within(chapter1).getByText('Failed to load image')
    ).toBeInTheDocument();
    expect(imageElement).toHaveStyle('opacity: 0.5');
  });

  test('MediaActionBar accessibility', async () => {
    await setup({ config: BASE_CONFIG });

    const chapter1 = getChapterRegion('Chapter 1');
    const toolbar = within(chapter1).getByRole('toolbar', {
      name: 'Media actions',
    });

    expect(toolbar).toBeInTheDocument();

    const updateButton = within(toolbar).getByRole('button', {
      name: 'Update Media',
    });
    expect(updateButton).toHaveAttribute('aria-label', 'Update Media');

    const deleteButton = within(toolbar).getByRole('button', {
      name: 'storyMap.form_media_delete',
    });
    expect(deleteButton).toHaveAttribute(
      'aria-label',
      'storyMap.form_media_delete'
    );
  });

  test('Audio component with proper ARIA labels', async () => {
    const configWithAudio = {
      ...BASE_CONFIG,
      chapters: [
        {
          ...BASE_CONFIG.chapters[0],
          media: MEDIA_TEST_CONFIGS.audio,
        },
        ...BASE_CONFIG.chapters.slice(1),
      ],
    };

    await setup({ config: configWithAudio });

    const chapter1 = getChapterRegion('Chapter 1');
    const audioElement = within(chapter1).getByLabelText('Audio: audio.mp3');

    expect(audioElement).toHaveAttribute('aria-label', 'Audio: audio.mp3');
    expect(audioElement).toHaveAttribute('controls');
  });

  test('Video component with proper height management', async () => {
    const configWithVideo = {
      ...BASE_CONFIG,
      chapters: [
        {
          ...BASE_CONFIG.chapters[0],
          media: MEDIA_TEST_CONFIGS.video,
        },
        ...BASE_CONFIG.chapters.slice(1),
      ],
    };

    await setup({ config: configWithVideo });

    const chapter1 = getChapterRegion('Chapter 1');
    const videoElement = within(chapter1).getByLabelText('Video: video.mp4');

    expect(videoElement).toHaveAttribute('aria-label', 'Video: video.mp4');
    expect(videoElement).toHaveAttribute('controls');

    await act(async () => {
      setMediaElementProperties(videoElement, {
        videoWidth: 1920,
        videoHeight: 1080,
        offsetWidth: 400,
      });
      fireEvent.loadedMetadata(videoElement);
    });
  });

  test('Embedded iframe with lazy loading', async () => {
    const configWithEmbedded = {
      ...BASE_CONFIG,
      chapters: [
        {
          ...BASE_CONFIG.chapters[0],
          media: MEDIA_TEST_CONFIGS.embedded,
        },
        ...BASE_CONFIG.chapters.slice(1),
      ],
    };

    await setup({ config: configWithEmbedded });

    const chapter1 = getChapterRegion('Chapter 1');
    const iframe = within(chapter1).getByTitle('Test Video');

    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/test123'
    );
    expect(iframe).toHaveAttribute('title', 'Test Video');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveAttribute('allowfullscreen');
  });

  test('Add dialog radio button navigation', async () => {
    await setup({ config: BASE_CONFIG });

    const mediaDialog = await openMediaDialog('Chapter 2');

    const fileUploadRadio = within(mediaDialog).getByRole('radio', {
      name: /Upload a photo or audio file/i,
    });
    const embedRadio = within(mediaDialog).getByRole('radio', {
      name: /Link to a YouTube or Vimeo video/i,
    });

    expect(fileUploadRadio).toBeChecked();
    expect(embedRadio).not.toBeChecked();

    await act(async () => fireEvent.click(embedRadio));
    expect(embedRadio).toBeChecked();
    expect(fileUploadRadio).not.toBeChecked();

    const embedInput = within(mediaDialog).getByRole('textbox', {
      name: 'Link to a YouTube or Vimeo video',
    });
    expect(embedInput).toHaveAttribute(
      'aria-labelledby',
      'embedded-media-label'
    );
  });

  test('Error states in add dialog', async () => {
    await setup({ config: BASE_CONFIG });

    const mediaDialog = await openMediaDialog('Chapter 2');

    const embedRadio = within(mediaDialog).getByRole('radio', {
      name: /Link to a YouTube or Vimeo video/i,
    });
    await act(async () => fireEvent.click(embedRadio));

    const embedInput = within(mediaDialog).getByRole('textbox', {
      name: 'Link to a YouTube or Vimeo video',
    });

    await act(async () => {
      fireEvent.change(embedInput, { target: { value: 'invalid-url' } });
      fireEvent.blur(embedInput);
    });

    expect(
      within(mediaDialog).getByText('Enter a valid YouTube or Vimeo URL.')
    ).toBeInTheDocument();

    const addButton = within(mediaDialog).getByRole('button', {
      name: 'Add media',
    });
    expect(addButton).toBeDisabled();
  });

  test('Height calculation functions', async () => {
    await setup({ config: BASE_CONFIG });

    const chapter1 = getChapterRegion('Chapter 1');
    const imageElement = within(chapter1).getByRole('img', {
      name: 'Chapter media',
    });

    await act(async () => {
      setMediaElementProperties(imageElement, {
        naturalWidth: 800,
        naturalHeight: 1200,
        offsetWidth: 400,
      });
      fireEvent.load(imageElement);
    });

    await act(async () => {
      setMediaElementProperties(imageElement, {
        naturalWidth: 1600,
        naturalHeight: 400,
        offsetWidth: 400,
      });
      fireEvent.load(imageElement);
    });
  });

  test('Media action bar processing state', async () => {
    await setup({ config: BASE_CONFIG });

    const chapter1 = getChapterRegion('Chapter 1');
    const toolbar = within(chapter1).getByRole('toolbar', {
      name: 'Media actions',
    });
    const deleteButton = within(toolbar).getByRole('button', {
      name: 'storyMap.form_media_delete',
    });

    await act(async () => fireEvent.click(deleteButton));

    const confirmDialog = screen.getByRole('dialog', { name: 'Delete image?' });
    const confirmButton = within(confirmDialog).getByRole('button', {
      name: 'Delete image',
    });

    expect(confirmDialog).toBeInTheDocument();
    expect(confirmButton).toBeInTheDocument();
  });

  test('Configuration constants usage', async () => {
    const configWithMultipleMedia = {
      ...BASE_CONFIG,
      chapters: [
        { ...BASE_CONFIG.chapters[0], media: MEDIA_TEST_CONFIGS.image },
        { ...BASE_CONFIG.chapters[1], media: MEDIA_TEST_CONFIGS.audio },
        {
          id: 'chapter-3',
          title: 'Chapter 3',
          description: 'Chapter 3 description',
          media: MEDIA_TEST_CONFIGS.video,
        },
      ],
    };

    await setup({ config: configWithMultipleMedia });

    const chapter1 = getChapterRegion('Chapter 1');
    const chapter2 = getChapterRegion('Chapter 2');
    const chapter3 = getChapterRegion('Chapter 3');

    expect(within(chapter1).getByRole('img')).toBeInTheDocument();
    expect(
      within(chapter2).getByLabelText('Audio: audio.mp3')
    ).toBeInTheDocument();
    expect(
      within(chapter3).getByLabelText('Video: video.mp4')
    ).toBeInTheDocument();
  });
});
