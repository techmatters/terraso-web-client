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
import scrollama from 'scrollama';
import mapboxgl from 'gis/mapbox';
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
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
      location: {
        center: { lng: -79.89928261750599, lat: -2.423124847733348 },
        zoom: 5,
      },
    },
  ],
};

beforeEach(() => {
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.mockReturnValue({
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
    getCenter: jest.fn(),
    getZoom: jest.fn(),
    addSource: jest.fn(),
    setTerrain: jest.fn(),
    addLayer: jest.fn(),
  });
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
});

const setup = async config => {
  const onPublish = jest.fn().mockImplementation(() => Promise.resolve());
  const onSaveDraft = jest.fn().mockImplementation(() => Promise.resolve());

  await render(
    <StoryMapConfigContextProvider baseConfig={config}>
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
      name: 'Upload a photo or audio file Select File Accepted file formats: *.aac, *.gif, *.jpeg, *.jpg, *.mp3, *.png, *.wav Maximum file size: 10 MB',
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
  await setup(BASE_CONFIG);

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
  const { onSaveDraft } = await setup(BASE_CONFIG);

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
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  );
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
    getCenter: () => ({ lng: -99.91122777353772, lat: 21.64458705609789 }),
    getZoom: jest.fn(),
    flyTo: jest.fn(),
    addSource: jest.fn(),
    setTerrain: jest.fn(),
    addLayer: jest.fn(),
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

  await setup(BASE_CONFIG);

  // Get sidebar list
  const sidebarList = screen.getByRole('navigation', {
    name: 'Chapters sidebar',
  });

  const title = within(sidebarList).getByRole('button', {
    name: 'T Title',
  });
  const chapter1 = within(sidebarList).getByRole('button', {
    name: '1 Chapter 1',
  });
  const chapter2 = within(sidebarList).getByRole('button', {
    name: '2 Chapter 2',
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
  const { onSaveDraft } = await setup(BASE_CONFIG);

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

  // Change title and description
  await changeChaper({
    title: 'Untitled',
    newTitle: 'New chapter',
    newDescription: 'New chapter description',
    newFile: new File(['content2'], `test.jpg`, {
      type: `image/jpeg`,
    }),
  });

  // New chapter should be added to the outline
  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  expect(
    within(titleSection).getByRole('link', { name: 'New chapter' })
  ).toBeInTheDocument();

  // Save
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  );
  expect(onSaveDraft).toHaveBeenCalledTimes(1);
  const saveCall = onSaveDraft.mock.calls[0];
  expect(saveCall[0]).toEqual(
    expect.objectContaining({
      title: 'Story Map Title',
      subtitle: 'Story Map Subtitle',
      byline: 'by User',
    })
  );
  expect(saveCall[0].chapters[0]).toEqual(
    expect.objectContaining({
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
      media: {
        type: 'image/png',
        signedUrl: 'https://test.com/image.png',
      },
    })
  );
  expect(saveCall[0].chapters[1]).toEqual(
    expect.objectContaining({
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    })
  );
  expect(saveCall[0].chapters[2]).toEqual(
    expect.objectContaining({
      alignment: 'left',
      title: 'New chapter',
      description: 'New chapter description',
      mapAnimation: 'flyTo',
      rotateAnimation: false,
      onChapterEnter: [],
      onChapterExit: [],
    })
  );
  expect(saveCall[0].chapters[2].media).toEqual(
    expect.objectContaining({
      filename: 'test.jpg',
      type: 'image/jpeg',
    })
  );

  expect(saveCall[0].chapters[2].media.contentId).toEqual(
    Object.keys(saveCall[1])[0]
  );
});
test('StoryMapForm: Add embedded media', async () => {
  const { onSaveDraft } = await setup(BASE_CONFIG);

  await changeChaper({
    title: 'Chapter 2',
    newEmbed: 'https://youtu.be/n_uFzLPYDd8',
  });

  // Save
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  );
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
  const { onSaveDraft } = await setup(BASE_CONFIG);

  await changeChaper({
    title: 'Chapter 2',
    newFile: new File(['content2'], `test.jpg`, {
      type: `audio/mp3`,
    }),
  });

  // Save
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  );
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
  await setup(BASE_CONFIG);

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
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
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getCenter: () => ({ lng: -78.54414857836304, lat: -0.2294635049867253 }),
    getZoom: () => 10,
    getPitch: () => 64,
    getBearing: () => 45,
    setTerrain: jest.fn(),
  };
  mapboxgl.Map.mockReturnValue(map);
  const { onSaveDraft } = await setup(BASE_CONFIG);

  const chapter1 = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  const locationDialogButton = within(chapter1).getByRole('button', {
    name: 'Set Map Location',
  });
  await act(async () => fireEvent.click(locationDialogButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Set map location for Chapter 1',
  });

  await act(async () => map.onEvents['move']());

  await act(async () =>
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Set Location' })
    )
  );

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Save draft' })
    ).toBeInTheDocument();
  });

  // Save
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  );
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
