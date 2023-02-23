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

import mapboxgl from 'gis/mapbox';

import StoryMapForm from './StoryMapForm';
import { ConfigContextProvider } from './StoryMapForm/configContext';

// Mock mapboxgl
jest.mock('gis/mapbox', () => ({}));

beforeEach(() => {
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.prototype = {
    on: jest.fn(),
    remove: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(),
  };
});

const BASE_CONFIG = {
  title: 'Story Map Title',
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
    <ConfigContextProvider baseConfig={config}>
      <StoryMapForm onPublish={onPublish} onSaveDraft={onSaveDraft} />
    </ConfigContextProvider>
  );
};

const testChapter = ({ title, description, image }) => {
  const chapterSection = screen.getByRole('region', {
    name: `Chapter: ${title}`,
  });
  expect(
    within(chapterSection).getByRole('heading', { name: title })
  ).toBeInTheDocument();
  const descriptionTextbox = within(chapterSection).getByRole('textbox', {
    name: 'Chapter description',
  });
  expect(within(descriptionTextbox).getByText(description)).toBeInTheDocument();

  if (image) {
    const imageElement = within(chapterSection).getByRole('img', {
      name: 'Chapter media',
    });
    expect(imageElement).toHaveAttribute('src', image);
  }
};

test('StoryMapForm: Renders title and chapters correctly', async () => {
  await setup(BASE_CONFIG);

  const header = screen.getByRole('region', {
    name: '[TODO] Story editor Header',
  });
  expect(
    within(header).getByRole('heading', { name: 'Story Map Title' })
  ).toBeInTheDocument();

  testChapter({ title: 'Chapter 1', description: 'Chapter 1 description', image: 'https://test.com/image.png' });
  testChapter({ title: 'Chapter 2', description: 'Chapter 2 description' });
});
