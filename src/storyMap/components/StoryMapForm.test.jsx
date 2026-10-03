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
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import MapboxGlGeocoder from '@mapbox/mapbox-gl-geocoder';
import { when } from 'jest-when';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { createLoadedMapMock } from 'terraso-web-client/tests/mapboxMock';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import {
  TILESET_STATUS_PENDING,
  TILESET_STATUS_READY,
} from 'terraso-web-client/sharedData/sharedDataConstants';
import StoryMapForm from 'terraso-web-client/storyMap/components/StoryMapForm/index';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import useBufferedChapterFields, {
  BUFFERED_FIELD_COMMIT_STRATEGIES,
} from 'terraso-web-client/storyMap/components/StoryMapForm/useBufferedChapterFields';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';

// Mock mapboxgl
jest.mock('terraso-web-client/gis/mapbox', () => ({}));

// TODO test RichTextEditor
// Right now there is no way to test it, see: https://github.com/ianstormtaylor/slate/issues/4902
jest.mock(
  'terraso-web-client/common/components/RichTextEditor/index',
  () => props => {
    return (
      <input
        type="text"
        aria-label={props.label}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
      />
    );
  }
);

jest.mock('terraso-web-client/monitoring/analytics', () => ({
  ...jest.requireActual('terraso-web-client/monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

jest.mock('terraso-web-client/gis/components/MapStyleSwitcher', () => ({
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
  owner: {
    __typename: 'StoryMapNode',
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
  id: 'b7b3b6a0-8c16-4dd7-9a52-5a9f5dd7c2f4',
  title: 'Datalayer title 3',
};

const expectSave = async () => {
  const header = screen.getByRole('region', { name: 'Story editor Header' });
  expect(within(header).getByText('Saving…')).toBeInTheDocument();
  await waitFor(() => {
    expect(within(header).getByText('Draft saved')).toBeInTheDocument();
  });
};

const baseMapOptions = () =>
  createLoadedMapMock({
    getContainer: jest.fn().mockReturnValue(document.createElement('div')),
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

const OriginalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      this.cb([{ contentBoxSize: [{ blockSize: 600, inlineSize: 1200 }] }]);
    }
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  global.ResizeObserver = OriginalResizeObserver;
});

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
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

  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
  when(terrasoApi.requestGraphQL)
    .calledWith(expect.stringContaining('query visualizationConfigs'), {
      ownerId: 'story-map-id-1',
      email: '',
    })
    .mockResolvedValue({
      storyMapConfigs: {
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
      landscapeConfigs: {
        edges: [],
      },
      groupConfigs: {
        edges: [],
      },
      myGroups: {
        edges: [],
      },
      myLandscapes: {
        edges: [],
      },
    });
});

const setup = async ({ config, autoSaveDebounce = 1500 }) => {
  const onPublish = jest.fn().mockImplementation(() => Promise.resolve());
  const onSaveDraft = jest.fn().mockImplementation(() => Promise.resolve());

  const view = await render(
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
    ...view,
    onPublish,
    onSaveDraft,
  };
};

const BUFFERED_LIFECYCLE_FIELDS = {
  title: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED,
    delayMs: 500,
  },
  description: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED,
    delayMs: 500,
  },
  alignment: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.IMMEDIATE,
  },
};

const BufferedLifecycleHarnessInner = ({ chapter }) => {
  const { chapter: bufferedChapter, getFieldChangeHandler } =
    useBufferedChapterFields({
      chapter,
      bufferedFields: BUFFERED_LIFECYCLE_FIELDS,
    });

  return (
    <>
      <div data-testid="local-description">{bufferedChapter.description}</div>
      <button
        type="button"
        onClick={() =>
          getFieldChangeHandler('description')('Buffered chapter description')
        }
      >
        Buffer description
      </button>
    </>
  );
};

const BufferedLifecycleHarness = ({ chapterId }) => {
  const { config } = useStoryMapConfigDataContext();
  const { setConfig } = useStoryMapConfigActionsContext();
  const chapter = config.chapters.find(
    currentChapter => currentChapter.id === chapterId
  );

  return (
    <>
      {chapter ? (
        <BufferedLifecycleHarnessInner chapter={chapter} />
      ) : (
        <div data-testid="chapter-unmounted">unmounted</div>
      )}
      <button
        type="button"
        onClick={() =>
          setConfig(currentConfig => ({
            ...currentConfig,
            chapters: currentConfig.chapters.map(currentChapter =>
              currentChapter.id === chapterId
                ? {
                    ...currentChapter,
                    description: 'Persisted server description',
                  }
                : currentChapter
            ),
          }))
        }
      >
        Replace persisted description
      </button>
      <button
        type="button"
        onClick={() =>
          setConfig(currentConfig => ({
            ...currentConfig,
            chapters: currentConfig.chapters.filter(
              currentChapter => currentChapter.id !== chapterId
            ),
          }))
        }
      >
        Delete buffered chapter
      </button>
    </>
  );
};

const BufferedLifecycleProbe = ({ chapterId }) => {
  const { config } = useStoryMapConfigDataContext();
  const chapter = config.chapters.find(
    currentChapter => currentChapter.id === chapterId
  );

  return (
    <>
      <div data-testid="chapter-count">{config.chapters.length}</div>
      <div data-testid="persisted-description">
        {chapter?.description ?? 'deleted'}
      </div>
    </>
  );
};

const StoryThemeProbe = () => {
  const { config } = useStoryMapConfigDataContext();

  return (
    <div data-testid="story-theme-probe" data-theme-id={config.themeId || ''} />
  );
};

const setupBufferedLifecycleHarness = async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={BASE_CONFIG}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      <BufferedLifecycleHarness chapterId="chapter-1" />
      <BufferedLifecycleProbe chapterId="chapter-1" />
    </StoryMapConfigContextProvider>
  );
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
      name: 'Upload a photo or audio file Select File Accepted formats: .aac, .gif, .jpeg, .jpg, .mp3, .mp4, .png, .wav, .webp Maximum file size: 10 MB',
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

test('StoryMapForm: Edit Map button width matches chapter content width', async () => {
  await setup({
    config: {
      ...BASE_CONFIG,
      chapters: [
        {
          id: 'chapter-embed',
          title: 'Chapter with embed',
          description: 'Chapter with embed description',
          media: {
            type: 'embedded',
            source: 'youtube',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            title: 'Test video',
          },
          onChapterEnter: [],
          onChapterExit: [],
        },
        {
          id: 'chapter-no-media',
          title: 'Chapter without media',
          description: 'Chapter without media description',
          onChapterEnter: [],
          onChapterExit: [],
        },
      ],
    },
  });

  // The chapter content card (.step-content in StoryMap.css) is capped at
  // max-width 35vw plus its 50px x2 horizontal padding (border box
  // calc(35vw + 100px)). The chapter's grid container must be capped so its
  // 11/12 content cell lands exactly on that card width, keeping the Edit Map
  // button, the card, and the 1/12 alignment column adjacent.
  const embedButton = within(
    screen.getByRole('region', { name: 'Chapter: Chapter with embed' })
  ).getByRole('button', { name: 'Edit Map' });
  const embedContainer = embedButton.closest('.MuiGrid-container');
  expect(getComputedStyle(embedContainer).maxWidth).toBe(
    'calc((35vw + 100px) * 12 / 11)'
  );
  expect(getComputedStyle(embedButton).width).toBe('100%');

  // Without visual media the container cap never binds: the button fills its
  // grid cell as before.
  const noMediaButton = within(
    screen.getByRole('region', { name: 'Chapter: Chapter without media' })
  ).getByRole('button', { name: 'Edit Map' });
  expect(getComputedStyle(noMediaButton).width).toBe('100%');
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

test('StoryMapForm: Title label uses the story theme text color', async () => {
  await setup({ config: { ...BASE_CONFIG, themeId: 'theme-3' } });

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });

  await act(async () =>
    fireEvent.click(
      within(titleSection).getByRole('heading', { name: 'Story Map Title' })
    )
  );

  const titleLabel = within(titleSection).getByText('Title (Required)', {
    selector: 'label',
  });
  expect(titleLabel).toHaveStyle({ color: 'var(--story-theme-text)' });

  await act(async () => fireEvent.focus(titleLabel));
  expect(titleLabel).toHaveStyle({ color: 'var(--story-theme-text)' });
});

test('StoryMapForm: Title blur without changes should not trigger save', async () => {
  const { onSaveDraft } = await setup({
    config: BASE_CONFIG,
    autoSaveDebounce: 100,
  });

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });

  // Click on title to edit
  await act(async () =>
    fireEvent.click(
      within(titleSection).getByRole('heading', { name: 'Story Map Title' })
    )
  );

  const titleInput = within(titleSection).getByRole('textbox', {
    name: 'Story map title (Required)',
  });

  // Blur without making any changes
  await act(async () => fireEvent.blur(titleInput));

  // Wait for potential debounced save
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  // Should not trigger save when no changes were made
  expect(onSaveDraft).not.toHaveBeenCalled();
});

test('StoryMapForm: Publish flushes pending chapter buffered changes', async () => {
  const { onPublish, onSaveDraft } = await setup({
    config: BASE_CONFIG,
    autoSaveDebounce: 5000,
  });

  const chapterSection = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  await act(async () =>
    fireEvent.change(
      within(chapterSection).getByRole('textbox', {
        name: 'Chapter description',
      }),
      { target: { value: 'Published chapter description' } }
    )
  );

  expect(onSaveDraft).not.toHaveBeenCalled();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  );

  expect(onPublish).toHaveBeenCalledTimes(1);
  expect(onPublish.mock.calls[0][0].chapters[0].description).toBe(
    'Published chapter description'
  );
});

test('StoryMapForm: Buffered chapter text survives persisted chapter updates before debounce flush', async () => {
  jest.useFakeTimers();

  try {
    await setupBufferedLifecycleHarness();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Buffer description' })
      );
    });

    expect(screen.getByTestId('local-description')).toHaveTextContent(
      'Buffered chapter description'
    );
    expect(screen.getByTestId('persisted-description')).toHaveTextContent(
      'Chapter 1 description'
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Replace persisted description',
        })
      );
    });

    expect(screen.getByTestId('persisted-description')).toHaveTextContent(
      'Persisted server description'
    );
    expect(screen.getByTestId('local-description')).toHaveTextContent(
      'Buffered chapter description'
    );

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('persisted-description')).toHaveTextContent(
        'Buffered chapter description'
      );
    });
  } finally {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  }
});

test('StoryMapForm: Deleting a chapter with buffered text does not restore it during cleanup', async () => {
  jest.useFakeTimers();

  try {
    await setupBufferedLifecycleHarness();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Buffer description' })
      );
    });

    expect(screen.getByTestId('local-description')).toHaveTextContent(
      'Buffered chapter description'
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Delete buffered chapter' })
      );
    });

    expect(screen.getByTestId('chapter-unmounted')).toHaveTextContent(
      'unmounted'
    );
    expect(screen.getByTestId('chapter-count')).toHaveTextContent('2');
    expect(screen.getByTestId('persisted-description')).toHaveTextContent(
      'deleted'
    );

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId('chapter-count')).toHaveTextContent('2');
    expect(screen.getByTestId('persisted-description')).toHaveTextContent(
      'deleted'
    );
  } finally {
    jest.useRealTimers();
  }
});

test('StoryMapForm: Sidebar navigation', async () => {
  const map = {
    ...baseMapOptions(),
    getCenter: () => ({ lng: -99.91122777353772, lat: 21.64458705609789 }),
  };
  mapboxgl.Map.mockReturnValue(map);

  let intersectionObserverCallback;
  const OriginalIntersectionObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      intersectionObserverCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  await setup({ config: BASE_CONFIG });

  // Camera step-transitions follow chapter navigation only while the map is
  // NOT being positioned. The Configure Chapter sidebar (open by default)
  // suspends them — close it to get the playback behavior.
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Configure Chapter sidebar' })
    )
  );

  // Get sidebar list
  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  expect(
    within(sidebarList).getByRole('button', {
      name: /theme selector\. selected theme 1\./i,
    })
  ).toBeInTheDocument();

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

  // Trigger on chapter 1
  await act(async () => {
    intersectionObserverCallback([
      {
        isIntersecting: true,
        target: { id: 'chapter-1' },
      },
    ]);
  });
  expect(chapter1).toHaveAttribute('aria-current', 'step');
  expect(chapter2).not.toHaveAttribute('aria-current', 'step');
  expect(title).not.toHaveAttribute('aria-current', 'step');

  expect(map.flyTo).toHaveBeenCalledTimes(0);

  // Trigger on chapter 2
  await act(async () => {
    intersectionObserverCallback([
      {
        isIntersecting: true,
        target: { id: 'chapter-2' },
      },
    ]);
  });
  expect(chapter1).not.toHaveAttribute('aria-current', 'step');
  expect(chapter2).toHaveAttribute('aria-current', 'step');
  expect(title).not.toHaveAttribute('aria-current', 'step');

  expect(map.flyTo).toHaveBeenCalledTimes(1);

  // Trigger on title
  await act(async () => {
    intersectionObserverCallback([
      {
        isIntersecting: true,
        target: { id: STORY_MAP_TITLE_ID },
      },
    ]);
  });
  expect(title).toHaveAttribute('aria-current', 'step');
  expect(chapter1).not.toHaveAttribute('aria-current', 'step');
  expect(chapter2).not.toHaveAttribute('aria-current', 'step');

  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

test('StoryMapForm: Theme selector in chapters sidebar applies selection', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{ ...BASE_CONFIG, themeId: 'theme-1' }}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      <StoryThemeProbe />
      <StoryMapForm
        onPublish={jest.fn().mockImplementation(() => Promise.resolve())}
        onSaveDraft={jest.fn().mockImplementation(() => Promise.resolve())}
      />
    </StoryMapConfigContextProvider>
  );

  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  const toggleButton = within(sidebarList).getByRole('button', {
    name: /theme selector\. selected theme 1\./i,
  });

  expect(screen.getByTestId('story-theme-probe')).toHaveAttribute(
    'data-theme-id',
    'theme-1'
  );

  fireEvent.click(toggleButton);

  const themeEightButton = within(sidebarList).getByRole('radio', {
    name: /theme 8\. background dark gray\./i,
  });

  fireEvent.click(themeEightButton);

  expect(screen.getByTestId('story-theme-probe')).toHaveAttribute(
    'data-theme-id',
    'theme-8'
  );
  expect(
    within(sidebarList).queryByRole('radiogroup', {
      name: 'Theme',
    })
  ).not.toBeInTheDocument();
});

test('StoryMapForm: Theme selector uses radiogroup semantics and restores focus after keyboard dismissal', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{ ...BASE_CONFIG, themeId: 'theme-1' }}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      <StoryThemeProbe />
      <StoryMapForm
        onPublish={jest.fn().mockImplementation(() => Promise.resolve())}
        onSaveDraft={jest.fn().mockImplementation(() => Promise.resolve())}
      />
    </StoryMapConfigContextProvider>
  );

  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });
  const toggleButton = within(sidebarList).getByRole('button', {
    name: /theme selector\. selected theme 1\./i,
  });

  fireEvent.click(toggleButton);

  const themeList = within(sidebarList).getByRole('radiogroup', {
    name: 'Theme',
  });
  const selectedOption = within(themeList).getByRole('radio', {
    name: /theme 1\. background dark blue\./i,
  });
  const nextOption = within(themeList).getByRole('radio', {
    name: /theme 2\. background pale blue\./i,
  });

  await waitFor(() => {
    expect(selectedOption).toHaveFocus();
  });

  fireEvent.keyDown(selectedOption, { key: 'Escape' });

  await waitFor(() => {
    expect(toggleButton).toHaveFocus();
  });
  expect(
    within(sidebarList).queryByRole('radiogroup', {
      name: 'Theme',
    })
  ).not.toBeInTheDocument();
});

test('StoryMapForm: Theme selector shows theme description tooltip on hover', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{ ...BASE_CONFIG, themeId: 'theme-1' }}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      <StoryThemeProbe />
      <StoryMapForm
        onPublish={jest.fn().mockImplementation(() => Promise.resolve())}
        onSaveDraft={jest.fn().mockImplementation(() => Promise.resolve())}
      />
    </StoryMapConfigContextProvider>
  );

  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });
  const toggleButton = within(sidebarList).getByRole('button', {
    name: /theme selector\. selected theme 1\./i,
  });

  fireEvent.mouseOver(toggleButton.querySelector('[aria-hidden="true"]'));

  const tooltip = await screen.findByRole('tooltip');

  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(
    /Background dark blue\.\s+Text white\.\s+Hyperlink light blue\.\s+Highlight yellow\./
  );
  expect(tooltip.closest('[data-popper-placement]')).toHaveAttribute(
    'data-popper-placement',
    'right'
  );
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
    expect.anything(),
    expect.any(Number)
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
    expect.anything(),
    expect.any(Number)
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

  // Preview lives in the Settings sidebar (closed by default).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Preview draft' }))
  );

  expect(
    screen.getByRole('heading', { name: 'You are previewing Story Map Title' })
  ).toBeInTheDocument();

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

test('StoryMapForm: Show preview without title uses blank preview copy', async () => {
  await setup({
    config: {
      ...BASE_CONFIG,
      title: '',
    },
  });

  // Preview lives in the Settings sidebar (closed by default).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Preview draft' }))
  );

  expect(
    screen.getByRole('heading', { name: 'You are previewing' })
  ).toBeInTheDocument();
});

test('StoryMapForm: the editor map mounts positioning controls while configuring', async () => {
  const map = makeCameraMap(CAMERA_OPEN);
  mapboxgl.Map.mockReturnValue(map);
  MapboxGlGeocoder.mockClear();
  await setup({ config: BASE_CONFIG });

  // Controls attach to the ONE editor map (no dialog, no second map) while
  // the Configure Chapter sidebar is open.
  expect(MapboxGlGeocoder).toHaveBeenCalledTimes(1);
  expect(map.addControl).toHaveBeenCalled();

  // The chapter overlay must not eat map drags while the map is being
  // positioned (found in E2E); form controls keep their pointer events.
  expect(document.getElementById('features')).toHaveStyle({
    pointerEvents: 'none',
  });

  const geocoderOptions = MapboxGlGeocoder.mock.calls[0][0];
  const [coordinateResult] = geocoderOptions.localGeocoder('1.2345, -77.6543');

  expect(coordinateResult.center).toEqual([-77.6543, 1.2345]);
  expect(coordinateResult.place_name).toEqual('Coordinates: 1.2345, -77.6543');
  expect(geocoderOptions.getItemValue(coordinateResult)).toEqual(
    '1.2345, -77.6543'
  );
  expect(geocoderOptions.render(coordinateResult)).toEqual(
    '<div class="mapboxgl-ctrl-geocoder__result-coordinate">Coordinates: 1.2345, -77.6543</div>'
  );

  const standardResult = { place_name: 'Quito, Ecuador' };
  expect(geocoderOptions.getItemValue(standardResult)).toEqual(
    'Quito, Ecuador'
  );
  expect(geocoderOptions.render(standardResult)).toEqual('Quito, Ecuador');

  expect(
    geocoderOptions.render({
      place_name: '<b>Quito</b> & "Ecuador"',
    })
  ).toEqual('&lt;b&gt;Quito&lt;/b&gt; &amp; &quot;Ecuador&quot;');
});

test('StoryMapForm: map controls balance across sidebar open/close and detached geocoder DOM is safe', async () => {
  const map = makeCameraMap(CAMERA_OPEN);
  mapboxgl.Map.mockReturnValue(map);
  MapboxGlGeocoder.mockClear();
  const { unmount } = await setup({ config: BASE_CONFIG });

  // "Balance" = exactly one LIVE geocoder on the map at a time (StrictMode
  // remounts effects, so raw addControl counts may exceed one per session).
  const geocodersOf = () =>
    map.addControl.mock.calls
      .map(([control]) => control)
      .filter(control => control instanceof MapboxGlGeocoder);
  const liveGeocoders = () =>
    geocodersOf().filter(instance => Boolean(instance.container?.parentNode));

  expect(liveGeocoders().length).toBe(1);

  // Closing Configure Chapter detaches the control (no leak).
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Configure Chapter sidebar' })
    )
  );
  expect(liveGeocoders().length).toBe(0);
  expect(map.removeControl).toHaveBeenCalledWith(geocodersOf()[0]);

  // Reopening attaches a fresh instance (no stacking).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit Chapter' }))
  );
  expect(liveGeocoders().length).toBe(1);

  // Detach the live geocoder control's DOM (the real v5 property is
  // `container`): unmount must stay safe and skip removeControl for the
  // detached control.
  const [liveGeocoder] = liveGeocoders().slice(-1);
  liveGeocoder.container = { parentNode: null };
  const removalsBefore = map.removeControl.mock.calls.length;
  expect(() => unmount()).not.toThrow();
  expect(map.removeControl.mock.calls.length).toBe(removalsBefore);
});

test('StoryMapForm: Dragging the map writes the active chapter location immediately', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);
    const { onSaveDraft } = await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-2" />,
    });

    // Scroll to chapter 2: the map writes the ACTIVE step.
    await io.selectStep('chapter-2');

    map.moveCameraTo(CAMERA_FITTED);
    await act(async () => {
      map.fire('mousedown');
      map.fire('move');
      map.fire('moveend');
    });

    // Immediate apply: the config already carries the dragged location.
    expect(probeChapter().location).toEqual({
      center: CAMERA_FITTED.center,
      zoom: CAMERA_FITTED.zoom,
      pitch: CAMERA_FITTED.pitch,
      bearing: CAMERA_FITTED.bearing,
      bounds: [0, 0, 2, 2],
    });

    // …and the editor's draft autosave persists it.
    await expectSave();
    const saved = onSaveDraft.mock.calls
      .at(-1)[0]
      .chapters.find(({ id }) => id === 'chapter-2');
    expect(saved.location.center).toEqual(CAMERA_FITTED.center);
  } finally {
    io.restore();
  }
});

test('StoryMapForm: camera step transitions are suspended while configuring and resume on close', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);
    await setup({ config: BASE_CONFIG });

    // Scrolling to a chapter with a location while the Configure Chapter
    // sidebar is open must NOT move the camera (it would fight the drag).
    await io.selectStep('chapter-2');
    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();

    // Closing the sidebar resumes the camera step transitions and hands
    // pointer events back to the chapter overlay.
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Close Configure Chapter sidebar' })
      )
    );
    await waitFor(() => expect(map.flyTo).toHaveBeenCalled());
    expect(document.getElementById('features')).toHaveStyle({
      pointerEvents: 'auto',
    });
  } finally {
    io.restore();
  }
});

test('StoryMapForm: Change chapter style', async () => {
  const map = makeCameraMap(CAMERA_OPEN);
  mapboxgl.Map.mockReturnValue(map);
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  // The style switcher lives on the editor map while configuring; its
  // change writes config.style immediately (no dialog, no Save Map).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Change Style' }))
  );

  await expectSave();

  expect(onSaveDraft).toHaveBeenCalled();
  const saveCall = onSaveDraft.mock.calls.at(-1);
  expect(saveCall[0].style).toEqual('newStyle');
});

test('StoryMapForm: Add map layer', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);

    const { onSaveDraft } = await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });

    const addDataLayerItem = await (async () => {
      await waitFor(() => {
        expect(
          within(sidebar).getByRole('treeitem', {
            name: 'Datalayer title 1',
          })
        ).toBeInTheDocument();
      });
      return within(sidebar).getByRole('treeitem', {
        name: 'Datalayer title 1',
      });
    })();

    // Only renderable layers are listed in the tree: "Datalayer title 2" is
    // still processing and "Datalayer title 3" has no tileset.
    expect(
      within(sidebar).queryByRole('treeitem', {
        name: 'Datalayer title 2',
      })
    ).not.toBeInTheDocument();
    expect(
      within(sidebar).queryByRole('treeitem', {
        name: 'Datalayer title 3',
      })
    ).not.toBeInTheDocument();

    await act(async () => fireEvent.click(addDataLayerItem));

    // Immediate apply: the layer is on the active chapter already — the
    // editor's draft autosave persists it.
    await expectSave();

    expect(onSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        chapters: expect.arrayContaining([
          expect.objectContaining({
            mapLayers: [{ layerId: AC085 }],
            dataLayerConfigId: AC085,
          }),
        ]),
        dataLayers: {
          [AC085]: expect.objectContaining({
            visualizeConfig: expect.anything(),
            mapboxTilesetId: expect.anything(),
          }),
        },
      }),
      expect.anything(),
      expect.any(Number)
    );
  } finally {
    io.restore();
  }
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

  await waitFor(() => {
    expect(
      within(chaptersSection).getByRole('button', {
        name: 'Chapter 3',
      })
    ).toBeInTheDocument();
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

  let intersectionObserverCallback;
  const OriginalIntersectionObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      intersectionObserverCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  await setup({ config: BASE_CONFIG });

  // Go to chapter 1
  await waitFor(() =>
    expect(document.querySelector('#chapter-1')).toBeInTheDocument()
  );
  await act(async () =>
    intersectionObserverCallback([
      { isIntersecting: true, target: { id: 'chapter-1' } },
    ])
  );

  // Go to chapter 2
  await waitFor(() =>
    expect(document.querySelector('#chapter-2')).toBeInTheDocument()
  );
  await act(async () =>
    intersectionObserverCallback([
      { isIntersecting: true, target: { id: 'chapter-2' } },
    ])
  );
  await expect(map.setPaintProperty).toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    1
  );
  await expect(map.setPaintProperty).not.toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    0
  );

  // Go to chapter 1
  await act(async () =>
    intersectionObserverCallback([
      { isIntersecting: true, target: { id: 'chapter-1' } },
    ])
  );
  await expect(map.setPaintProperty).toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    1
  );
  await expect(map.setPaintProperty).not.toHaveBeenCalledWith(
    'layer1',
    'fill-opacity',
    0
  );

  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

test('StoryMapForm: Add featured image', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  // The featured image control lives in the Settings sidebar (closed by
  // default).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );

  const sidebar = screen.getByRole('complementary', {
    name: 'Right sidebar',
  });

  const featuredImageButton = within(sidebar).getByRole('button', {
    name: 'Featured Image',
  });
  await act(async () => fireEvent.click(featuredImageButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Featured Image',
  });

  expect(
    within(dialog).getByText('Recommended dimensions: 1200 x 630 pixels')
  ).toBeInTheDocument();

  const dropZone = within(dialog).getByRole('button', {
    name: /Select File/,
  });
  const imageFile = new File(['featured-image-content'], 'featured.jpg', {
    type: 'image/jpeg',
  });
  const data = {
    dataTransfer: {
      files: [imageFile],
      items: [
        {
          kind: 'file',
          type: imageFile.type,
          getAsFile: () => imageFile,
        },
      ],
      types: ['Files'],
    },
  };
  await act(async () => fireEvent.drop(dropZone, data));

  const descriptionInput = within(dialog).getByRole('textbox', {
    name: 'Featured image description (alt text)',
  });
  await act(async () =>
    fireEvent.change(descriptionInput, {
      target: { value: 'A beautiful featured image' },
    })
  );

  const saveButton = within(dialog).getByRole('button', { name: 'Save' });
  await act(async () => fireEvent.click(saveButton));

  await waitFor(() => {
    expect(
      screen.queryByRole('dialog', { name: 'Featured Image' })
    ).not.toBeInTheDocument();
  });

  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].featuredImage).toEqual(
    expect.objectContaining({
      description: 'A beautiful featured image',
      contentId: expect.any(String),
    })
  );
});

test('StoryMapForm: Add short description', async () => {
  const { onSaveDraft } = await setup({ config: BASE_CONFIG });

  // The short description control lives in the Settings sidebar (closed by
  // default).
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );

  const sidebar = screen.getByRole('complementary', {
    name: 'Right sidebar',
  });

  const shortDescriptionButton = within(sidebar).getByRole('button', {
    name: 'Add short description',
  });
  await act(async () => fireEvent.click(shortDescriptionButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Short Description',
  });

  const descriptionInput = within(dialog).getByRole('textbox');
  await act(async () =>
    fireEvent.change(descriptionInput, {
      target: {
        value:
          'A monarch pupa sews its butterfly wings inside the chrysalis for Sunday Crafternoon!',
      },
    })
  );

  const saveButton = within(dialog).getByRole('button', { name: 'Save' });
  await act(async () => fireEvent.click(saveButton));

  await waitFor(() => {
    expect(
      screen.queryByRole('dialog', { name: 'Short Description' })
    ).not.toBeInTheDocument();
  });

  await expectSave();

  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0].description).toBe(
    'A monarch pupa sews its butterfly wings inside the chrysalis for Sunday Crafternoon!'
  );
});

// ---------------------------------------------------------------------------
// Multi-layer map configuration: `mapLayers` is the single source of truth;
// `dataLayerConfigId`/`onChapterEnter`/`onChapterExit` are derived compat
// fields regenerated at the config write boundary.
// ---------------------------------------------------------------------------

const AC085 = 'ac0853a2-99e4-4794-93ca-aafc89f361b6';

const ChapterLayerFieldsProbe = ({
  chapterId,
  testId = 'layer-fields-probe',
}) => {
  const { config } = useStoryMapConfigDataContext();
  const chapter = config.chapters.find(({ id }) => id === chapterId) ?? {};
  return (
    <div
      data-testid={testId}
      data-fields={JSON.stringify({
        mapLayers: chapter.mapLayers ?? null,
        dataLayerConfigId: chapter.dataLayerConfigId ?? null,
        onChapterEnter: chapter.onChapterEnter ?? null,
        onChapterExit: chapter.onChapterExit ?? null,
      })}
    />
  );
};

const probeFields = (testId = 'layer-fields-probe') =>
  JSON.parse(screen.getByTestId(testId).getAttribute('data-fields') ?? '{}');

const setupWithProbe = async ({ config, probe }) => {
  const onPublish = jest.fn().mockImplementation(() => Promise.resolve());
  const onSaveDraft = jest.fn().mockImplementation(() => Promise.resolve());
  await render(
    <StoryMapConfigContextProvider
      baseConfig={config}
      storyMap={{
        id: 'story-map-id-1',
        memberships: [],
      }}
    >
      {probe}
      <StoryMapForm onPublish={onPublish} onSaveDraft={onSaveDraft} />
    </StoryMapConfigContextProvider>
  );
  return { onPublish, onSaveDraft };
};

test('StoryMapForm: Legacy chapter materializes mapLayers on the first sidebar layer edit', async () => {
  const io = installIntersectionObserverCapture();
  try {
    mapboxgl.Map.mockReturnValue(makeCameraMap(CAMERA_OPEN));
    const { onSaveDraft } = await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterLayerFieldsProbe chapterId="chapter-2" />,
    });
    await io.selectStep('chapter-2');

    // Legacy chapter: dataLayerConfigId + hand-authored events, no mapLayers.
    let fields = probeFields();
    expect(fields.mapLayers).toBeNull();
    expect(fields.dataLayerConfigId).toBe(AC085);
    expect(fields.onChapterEnter).toEqual([
      { layer: 'layer1', opacity: 1, duration: 0 },
    ]);

    // Mere exposure to the sidebar writes nothing (immediate apply writes on
    // EDITS only).
    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    await waitFor(() => {
      expect(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    fields = probeFields();
    expect(fields.mapLayers).toBeNull();
    expect(fields.dataLayerConfigId).toBe(AC085);
    expect(fields.onChapterEnter).toEqual([
      { layer: 'layer1', opacity: 1, duration: 0 },
    ]);
    expect(onSaveDraft).not.toHaveBeenCalled();

    // The first layer edit materializes mapLayers + the derived compat
    // fields (toggle off + on keeps the legacy layer in place).
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );
    await expectSave();

    fields = probeFields();
    expect(fields.mapLayers).toEqual([{ layerId: AC085 }]);
    expect(fields.dataLayerConfigId).toBe(AC085);
    expect(fields.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'layer1', opacity: 1, duration: 0 },
        { layer: `${AC085}-markers`, opacity: 1, duration: 0 },
        { layer: `${AC085}-polygons-outline`, opacity: 1, duration: 0 },
        { layer: `${AC085}-polygons-fill`, opacity: 0.5, duration: 0 },
      ])
    );
    expect(fields.onChapterExit).toEqual(
      expect.arrayContaining([
        { layer: 'layer1', opacity: 0, duration: 0 },
        { layer: `${AC085}-markers`, opacity: 0, duration: 0 },
      ])
    );
  } finally {
    io.restore();
  }
});

test('StoryMapForm: Sidebar layer edits regenerate chapter layer events and drop stale ones', async () => {
  const config = {
    ...BASE_CONFIG,
    chapters: [
      {
        ...BASE_CONFIG.chapters[0],
        mapLayers: [{ layerId: 'stale-layer' }],
        dataLayerConfigId: 'stale-layer',
        onChapterEnter: [
          { layer: 'layer1', opacity: 1, duration: 0 },
          { layer: 'stale-layer-markers', opacity: 1, duration: 0 },
          { layer: 'stale-layer-polygons-fill', opacity: 0.01, duration: 0 },
        ],
        onChapterExit: [
          { layer: 'layer1', opacity: 0, duration: 0 },
          { layer: 'stale-layer-markers', opacity: 0, duration: 0 },
        ],
      },
      ...BASE_CONFIG.chapters.slice(1),
    ],
    dataLayers: {
      'stale-layer': {
        id: 'stale-layer',
        title: 'Stale Layer',
        ownerType: 'StoryMapNode',
        geojsonSignedUrl: 'https://example.com/stale.geojson?sig=1',
      },
    },
  };
  const io = installIntersectionObserverCapture();
  try {
    mapboxgl.Map.mockReturnValue(makeCameraMap(CAMERA_OPEN));
    const { onSaveDraft } = await setupWithProbe({
      config,
      probe: <ChapterLayerFieldsProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });

    // Remove the stale layer, add the fetched one.
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('button', {
          name: 'Remove Stale Layer from this chapter',
        })
      )
    );
    await waitFor(() => {
      expect(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );
    await expectSave();

    const saved = onSaveDraft.mock.calls.at(-1)[0].chapters[0];
    expect(saved.mapLayers).toEqual([{ layerId: AC085 }]);
    // Most recently added layer.
    expect(saved.dataLayerConfigId).toBe(AC085);
    // Regenerated events for ALL layers (per-layer-type opacities) + preserved
    // hand-authored entries.
    expect(saved.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'layer1', opacity: 1, duration: 0 },
        { layer: `${AC085}-markers`, opacity: 1, duration: 0 },
        { layer: `${AC085}-polygons-outline`, opacity: 1, duration: 0 },
        { layer: `${AC085}-polygons-fill`, opacity: 0.5, duration: 0 },
      ])
    );
    expect(saved.onChapterExit).toEqual(
      expect.arrayContaining([
        { layer: 'layer1', opacity: 0, duration: 0 },
        { layer: `${AC085}-markers`, opacity: 0, duration: 0 },
        { layer: `${AC085}-polygons-fill`, opacity: 0, duration: 0 },
      ])
    );
    // Stale generated entries for the removed layer are gone.
    const eventLayers = [...saved.onChapterEnter, ...saved.onChapterExit].map(
      ({ layer }) => layer
    );
    expect(
      eventLayers.filter(layer => layer.startsWith('stale-layer'))
    ).toEqual([]);
  } finally {
    io.restore();
  }
});

test('StoryMapForm: Add map layer to the title transition', async () => {
  const io = installIntersectionObserverCapture();
  try {
    mapboxgl.Map.mockReturnValue(makeCameraMap(CAMERA_OPEN));
    const { onSaveDraft } = await setup({ config: BASE_CONFIG });

    // Scroll to the title step: the sidebar edits `titleTransition`.
    await io.selectStep(STORY_MAP_TITLE_ID);

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    await waitFor(() => {
      expect(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );
    await expectSave();

    const saved = onSaveDraft.mock.calls.at(-1)[0];
    expect(saved.titleTransition.mapLayers).toEqual([{ layerId: AC085 }]);
    expect(saved.titleTransition.dataLayerConfigId).toBe(AC085);
    expect(saved.titleTransition.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: `${AC085}-markers`, opacity: 1, duration: 0 },
        { layer: `${AC085}-polygons-fill`, opacity: 0.5, duration: 0 },
      ])
    );
    expect(saved.titleTransition.onChapterExit).toEqual(
      expect.arrayContaining([
        { layer: `${AC085}-polygons-fill`, opacity: 0, duration: 0 },
      ])
    );
  } finally {
    io.restore();
  }
});

const makeTwoLayerConfig = () => ({
  ...BASE_CONFIG,
  chapters: [
    {
      ...BASE_CONFIG.chapters[0],
      mapLayers: [{ layerId: 'layer-b' }, { layerId: 'layer-a' }],
      dataLayerConfigId: 'layer-b',
    },
    ...BASE_CONFIG.chapters.slice(1),
  ],
  dataLayers: {
    'layer-a': {
      id: 'layer-a',
      title: 'Alpha',
      ownerType: 'StoryMapNode',
      geojsonSignedUrl: 'https://example.com/a.geojson?sig=1',
      visualizeConfig: {
        shape: 'circle',
        size: 15,
        color: '#000000',
        opacity: 50,
      },
    },
    'layer-b': {
      id: 'layer-b',
      title: 'Beta',
      ownerType: 'StoryMapNode',
      geojsonSignedUrl: 'https://example.com/b.geojson?sig=1',
      visualizeConfig: {
        shape: 'circle',
        size: 15,
        color: '#000000',
        opacity: 25,
      },
    },
  },
});

test('StoryMapForm: Removing the pointed layer repoints dataLayerConfigId to the topmost remaining', async () => {
  const io = installIntersectionObserverCapture();
  try {
    mapboxgl.Map.mockReturnValue(makeCameraMap(CAMERA_OPEN));
    const { onSaveDraft } = await setupWithProbe({
      config: makeTwoLayerConfig(),
      probe: <ChapterLayerFieldsProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('button', {
          name: 'Remove Beta from this chapter',
        })
      )
    );
    await expectSave();

    const saved = onSaveDraft.mock.calls.at(-1)[0].chapters[0];
    expect(saved.mapLayers).toEqual([{ layerId: 'layer-a' }]);
    expect(saved.dataLayerConfigId).toBe('layer-a');
    const eventLayers = [...saved.onChapterEnter, ...saved.onChapterExit].map(
      ({ layer }) => layer
    );
    expect(eventLayers.filter(layer => layer.startsWith('layer-b'))).toEqual(
      []
    );
    expect(eventLayers).toEqual(
      expect.arrayContaining(['layer-a-markers', 'layer-a-polygons-fill'])
    );
  } finally {
    io.restore();
  }
});

test('StoryMapForm: Removing all layers clears dataLayerConfigId and generated events', async () => {
  const io = installIntersectionObserverCapture();
  try {
    mapboxgl.Map.mockReturnValue(makeCameraMap(CAMERA_OPEN));
    const { onSaveDraft } = await setupWithProbe({
      config: makeTwoLayerConfig(),
      probe: <ChapterLayerFieldsProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('button', {
          name: 'Remove Beta from this chapter',
        })
      )
    );
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('button', {
          name: 'Remove Alpha from this chapter',
        })
      )
    );
    await expectSave();

    const saved = onSaveDraft.mock.calls.at(-1)[0].chapters[0];
    expect(saved.mapLayers).toEqual([]);
    expect(saved.dataLayerConfigId).toBeUndefined();
    // Only the preserved hand-authored entries remain.
    expect(saved.onChapterEnter).toEqual([
      { layer: 'layer1', opacity: 1, duration: 0 },
    ]);
    expect(saved.onChapterExit).toEqual([
      { layer: 'layer1', opacity: 0, duration: 0 },
    ]);
  } finally {
    io.restore();
  }
});
const makeCameraMap = openValues => {
  let current = openValues;
  return {
    ...baseMapOptions(),
    getCenter: () => current.center,
    getZoom: () => current.zoom,
    getPitch: () => current.pitch,
    getBearing: () => current.bearing,
    getBounds: jest.fn().mockReturnValue({
      toArray: () => current.bounds,
    }),
    moveCameraTo: next => {
      current = next;
    },
  };
};

const CAMERA_OPEN = {
  center: { lng: -79.89928261750599, lat: -2.423124847733348 },
  zoom: 5,
  pitch: 0,
  bearing: 0,
  bounds: [
    [-180, -90],
    [180, 90],
  ],
};
const CAMERA_FITTED = {
  center: { lng: 1, lat: 1 },
  zoom: 12,
  pitch: 0,
  bearing: 0,
  bounds: [
    [0, 0],
    [2, 2],
  ],
};

test('StoryMapForm: Adding a layer does not rewrite the chapter camera', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);
    const { onSaveDraft } = await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    await waitFor(() => {
      expect(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    await act(async () =>
      fireEvent.click(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );

    // The map fits the added layer: a programmatic map move…
    map.moveCameraTo(CAMERA_FITTED);
    await act(async () => {
      map.fire('move');
      map.fire('moveend');
    });

    // …which is never recorded on the active chapter (it had no location and
    // still has none).
    expect(probeChapter().location).toBeNull();
    await expectSave();
    const saved = onSaveDraft.mock.calls
      .at(-1)[0]
      .chapters.find(({ id }) => id === 'chapter-1');
    expect(saved.location).toBeUndefined();
  } finally {
    io.restore();
  }
});

test('StoryMapForm: a burst of programmatic moveends is fully suppressed', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);
    await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    await waitFor(() => {
      expect(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    await act(async () =>
      fireEvent.click(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );

    // A bounds fit can fire SEVERAL moveends (real mapbox does): every one of
    // them is programmatic — none may be recorded (found in E2E: the last
    // moveend of the burst wrote the fit camera onto the chapter).
    map.moveCameraTo(CAMERA_FITTED);
    await act(async () => {
      map.fire('move');
      map.fire('moveend');
    });
    await act(async () => {
      map.fire('move');
      map.fire('moveend');
    });
    expect(probeChapter().location).toBeNull();

    // The next REAL user move is still recorded.
    await act(async () => {
      map.fire('mousedown');
      map.moveCameraTo(CAMERA_OPEN);
      map.fire('move');
      map.fire('moveend');
    });
    expect(probeChapter().location.center).toEqual(CAMERA_OPEN.center);
  } finally {
    io.restore();
  }
});

test('StoryMapForm: A user map move is still recorded after adding a layer', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const map = makeCameraMap(CAMERA_OPEN);
    mapboxgl.Map.mockReturnValue(map);
    await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-1" />,
    });
    await io.selectStep('chapter-1');

    await waitFor(() => {
      expect(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      ).toBeInTheDocument();
    });
    await act(async () =>
      fireEvent.click(
        screen.getByRole('treeitem', { name: 'Datalayer title 1' })
      )
    );
    // The fit move (programmatic) is not recorded: no location appears.
    map.moveCameraTo(CAMERA_FITTED);
    await act(async () => {
      map.fire('move');
      map.fire('moveend');
    });
    expect(probeChapter().location).toBeNull();

    // A real user move afterwards IS recorded.
    await act(async () => {
      map.fire('mousedown');
      map.moveCameraTo(CAMERA_OPEN);
      map.fire('move');
      map.fire('moveend');
    });

    expect(probeChapter().location.center).toEqual(CAMERA_OPEN.center);
    expect(probeChapter().location.zoom).toBe(CAMERA_OPEN.zoom);
  } finally {
    io.restore();
  }
});
// ---------------------------------------------------------------------------
// Configure Chapter sidebar (persistent, mutually exclusive with Settings)
// + top bar reorganization.
// ---------------------------------------------------------------------------

const installIntersectionObserverCapture = () => {
  const OriginalIntersectionObserver = globalThis.IntersectionObserver;
  let intersectionObserverCallback;
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      intersectionObserverCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  return {
    selectStep: async id => {
      await act(async () =>
        intersectionObserverCallback([{ isIntersecting: true, target: { id } }])
      );
    },
    restore: () => {
      globalThis.IntersectionObserver = OriginalIntersectionObserver;
    },
  };
};

const ChapterAlignmentProbe = ({ chapterId, testId = 'alignment-probe' }) => {
  const { config } = useStoryMapConfigDataContext();
  const chapter = config.chapters.find(({ id }) => id === chapterId) ?? {};
  return (
    <div
      data-testid={testId}
      data-alignment={chapter.alignment ?? ''}
      data-location={JSON.stringify(chapter.location ?? null)}
    />
  );
};

const probeChapter = (testId = 'alignment-probe') => ({
  alignment: screen.getByTestId(testId).getAttribute('data-alignment'),
  location: JSON.parse(
    screen.getByTestId(testId).getAttribute('data-location') ?? 'null'
  ),
});

test('StoryMapForm: top bar has a tools section and an Edit Chapter section', async () => {
  await setup({ config: BASE_CONFIG });

  const header = screen.getByRole('region', { name: 'Story editor Header' });

  const tools = within(header).getByRole('group', { name: 'Story map tools' });
  expect(within(tools).getByText('Draft saved')).toBeInTheDocument();
  expect(
    within(tools).getByRole('button', { name: 'Publish' })
  ).toBeInTheDocument();
  expect(
    within(tools).getByRole('button', { name: 'Settings' })
  ).toBeInTheDocument();
  expect(
    within(tools).queryByRole('button', { name: 'Edit Chapter' })
  ).not.toBeInTheDocument();

  const chapterTools = within(header).getByRole('group', {
    name: 'Chapter tools',
  });
  expect(
    within(chapterTools).getByRole('button', { name: 'Edit Chapter' })
  ).toBeInTheDocument();
  expect(
    within(chapterTools).queryByRole('button', { name: 'Publish' })
  ).not.toBeInTheDocument();
});

test('StoryMapForm: Configure Chapter sidebar is open by default with a title and a close button', async () => {
  await setup({ config: BASE_CONFIG });

  expect(
    screen.getByRole('complementary', { name: 'Configure Chapter sidebar' })
  ).toBeInTheDocument();
  expect(screen.getByText('Configure Chapter')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Close Configure Chapter sidebar' })
  ).toBeInTheDocument();

  // Settings is closed (mutually exclusive, Configure Chapter wins the
  // default).
  expect(
    screen.queryByRole('complementary', { name: 'Right sidebar' })
  ).not.toBeInTheDocument();
});

test('StoryMapForm: right sidebars are mutually exclusive', async () => {
  await setup({ config: BASE_CONFIG });

  // Gear opens Settings, closing Configure Chapter.
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );
  expect(
    screen.getByRole('complementary', { name: 'Right sidebar' })
  ).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Close Settings sidebar' })
  ).toBeInTheDocument();
  expect(screen.queryByText('Configure Chapter')).not.toBeInTheDocument();

  // "Edit Chapter" opens Configure Chapter, closing Settings.
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit Chapter' }))
  );
  expect(screen.getByText('Configure Chapter')).toBeInTheDocument();
  expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('complementary', { name: 'Right sidebar' })
  ).not.toBeInTheDocument();

  // "Edit Chapter" toggles closed when already open.
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit Chapter' }))
  );
  expect(screen.queryByText('Configure Chapter')).not.toBeInTheDocument();
  expect(screen.queryByText('Settings')).not.toBeInTheDocument();

  // X closes whichever sidebar is open.
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Settings sidebar' })
    )
  );
  expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  expect(screen.queryByText('Configure Chapter')).not.toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit Chapter' }))
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Configure Chapter sidebar' })
    )
  );
  expect(screen.queryByText('Configure Chapter')).not.toBeInTheDocument();
  expect(screen.queryByText('Settings')).not.toBeInTheDocument();
});

test('StoryMapForm: alignment controls moved from the chapter editor to the configure sidebar', async () => {
  const io = installIntersectionObserverCapture();
  try {
    await setup({ config: BASE_CONFIG });

    // Scroll to chapter 1: alignment is a per-chapter setting.
    await io.selectStep('chapter-1');

    const chapter1 = screen.getByRole('region', { name: 'Chapter: Chapter 1' });
    expect(
      within(chapter1).queryByRole('group', { name: 'Set alignment' })
    ).not.toBeInTheDocument();

    // The alignment control lives in the Configure Chapter sidebar instead.
    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    expect(
      within(sidebar).getByRole('group', { name: 'Set alignment' })
    ).toBeInTheDocument();
  } finally {
    io.restore();
  }
});

test('StoryMapForm: chapter and title editors drop the map buttons', async () => {
  await setup({ config: BASE_CONFIG });

  // The map configuration dialog is gone: no 'Edit Map'/'Set Map Location'
  // buttons remain — the map is configured in place via the sidebar.
  const chapter1 = screen.getByRole('region', { name: 'Chapter: Chapter 1' });
  expect(
    within(chapter1).queryByRole('button', { name: 'Edit Map' })
  ).not.toBeInTheDocument();

  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  expect(
    within(titleSection).queryByRole('button', { name: 'Set Map Location' })
  ).not.toBeInTheDocument();
});

test('StoryMapForm: alignment buttons in the sidebar write the active chapter alignment', async () => {
  const io = installIntersectionObserverCapture();
  try {
    const { onSaveDraft } = await setupWithProbe({
      config: BASE_CONFIG,
      probe: <ChapterAlignmentProbe chapterId="chapter-1" />,
    });

    // Scroll to chapter 1: the sidebar targets the active step.
    await io.selectStep('chapter-1');

    const sidebar = screen.getByRole('complementary', {
      name: 'Configure Chapter sidebar',
    });
    await act(async () =>
      fireEvent.click(
        within(sidebar).getByRole('button', { name: 'Align Left' })
      )
    );

    // Immediate apply: the config carries the new alignment and the chapter
    // card realigns.
    expect(probeChapter().alignment).toBe('left');
    expect(
      screen.getByRole('region', { name: 'Chapter: Chapter 1' })
    ).toHaveClass('lefty');

    await expectSave();
    const saved = onSaveDraft.mock.calls
      .at(-1)[0]
      .chapters.find(({ id }) => id === 'chapter-1');
    expect(saved.alignment).toBe('left');
  } finally {
    io.restore();
  }
});
