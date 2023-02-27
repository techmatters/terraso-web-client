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

beforeEach(() => {
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.prototype = {
    on: (type, cb) => {
      if (type === 'load') {
        cb();
      }
    },
    remove: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(),
  };
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
    },
  ],
};

const setup = async config => {
  const onPublish = jest.fn();
  const onSaveDraft = jest.fn();

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
    expect(
      within(descriptionTextbox).getByText(description)
    ).toBeInTheDocument();
  }

  if (image) {
    const imageElement = within(chapterSection).getByRole('img', {
      name: 'Chapter media',
    });
    expect(imageElement).toHaveAttribute('src', image);
  }
};

const changeChaper = async (title, newTitle, newDescription, newFile) => {
  const chapterSection = screen.getByRole('region', {
    name: `Chapter: ${title}`,
  });
  const titleTextbox = within(chapterSection).getByRole('textbox', {
    name: 'Chapter title',
  });
  await act(async () =>
    fireEvent.change(titleTextbox, { target: { value: newTitle } })
  );

  // TODO test rich text editor
  // const descriptionTextbox = within(chapterSection).getByRole('textbox', {
  //   name: 'Chapter description',
  // });

  if (newFile) {
    const mediaButton = within(chapterSection).getByRole('button', {
      name: 'Add media',
    });
    await act(async () => fireEvent.click(mediaButton));

    const mediaDialog = screen.getByRole('dialog', {
      name: 'Add media',
    });
    const dropZone = within(mediaDialog).getByRole('button', {
      name: 'Upload a photo or audio file Select File Accepted file formats: *.aac, *.gif, *.jpeg, *.jpg, *.mp3, *.ogg, *.png, *.wav Maximum file size: 10 MB',
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
      expect(screen.getByRole('button', { name: 'Add' })).not.toHaveAttribute(
        'disabled'
      )
    );

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    );
  }
};

test('StoryMapForm: Renders title and chapters correctly', async () => {
  await setup(BASE_CONFIG);

  // Editor header
  const header = screen.getByRole('region', {
    name: '[TODO] Story editor Header',
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

test('StoryMapForm: Sidebar navigation', async () => {
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
    name: '[TODO] Chapters sidebar',
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
  expect(chapter1).toHaveAttribute('aria-current', 'page');
  expect(chapter2).not.toHaveAttribute('aria-current', 'page');
  expect(title).not.toHaveAttribute('aria-current', 'page');

  // Trigger on chapter 2
  await act(async () => {
    scroller.stepEnter({
      element: document.querySelector('#chapter-2'),
    });
  });
  expect(chapter1).not.toHaveAttribute('aria-current', 'page');
  expect(chapter2).toHaveAttribute('aria-current', 'page');
  expect(title).not.toHaveAttribute('aria-current', 'page');

  // Trigger on title
  await act(async () => {
    scroller.stepEnter({
      element: document.querySelector('#story-map-title'),
    });
  });
  expect(title).toHaveAttribute('aria-current', 'page');
  expect(chapter1).not.toHaveAttribute('aria-current', 'page');
  expect(chapter2).not.toHaveAttribute('aria-current', 'page');
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
    name: 'Chapter: (No title)',
  });
  expect(newChapter).toBeInTheDocument();

  // Change title and description
  await changeChaper(
    '(No title)',
    'New chapter',
    'New chapter description',
    new File(['content2'], `test.jpg`, {
      type: `image/jpeg`,
    })
  );

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
      description: '',
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
