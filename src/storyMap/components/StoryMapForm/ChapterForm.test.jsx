/*
 * Copyright © 2026 Technology Matters
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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import BufferedChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/BufferedChapterForm';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext',
  () => ({
    useStoryMapConfigActionsContext: jest.fn(),
  })
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia',
  () => () => null
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableText',
  () => props => (
    <input
      aria-label={props.inputProps?.inputProps?.['aria-label'] ?? props.label}
      value={props.value || ''}
      onBlur={props.onBlur}
      onChange={event => props.onChange(event.target.value)}
    />
  )
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText',
  () => props => (
    <input
      aria-label={props.label}
      value={props.value || ''}
      onBlur={props.onBlur}
      onChange={event => props.onChange(event.target.value)}
    />
  )
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog',
  () => ({
    MapConfigurationDialog: () => null,
  })
);

const setConfig = jest.fn();
const registerBufferedChapterChangesFlusher = jest.fn(() => jest.fn());
const setBufferedChapterChangesPending = jest.fn();

const baseRecord = {
  id: 'chapter-1',
  alignment: 'left',
  title: 'Chapter 1',
  description: 'Chapter 1 description',
  onChapterEnter: [],
  onChapterExit: [],
};

const baseConfig = {
  chapters: [baseRecord],
  dataLayers: {},
};

const renderChapterForm = async (record = baseRecord) =>
  render(<BufferedChapterForm theme="dark" record={record} />);

const getCommittedConfig = callIndex =>
  setConfig.mock.calls[callIndex][0](baseConfig);

beforeEach(() => {
  jest.useFakeTimers();
  setConfig.mockClear();
  registerBufferedChapterChangesFlusher.mockClear();
  setBufferedChapterChangesPending.mockClear();
  useStoryMapConfigActionsContext.mockReturnValue({
    init: { current: false },
    setConfig,
    setBufferedChapterChangesPending,
    registerBufferedChapterChangesFlusher,
    getConfig: () => baseConfig,
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('ChapterForm debounces chapter title commits', async () => {
  await renderChapterForm();

  await act(async () =>
    fireEvent.change(screen.getByRole('textbox', { name: 'Chapter title' }), {
      target: { value: 'Updated title' },
    })
  );

  expect(setConfig).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(499);
  });

  expect(setConfig).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(1);
  });

  expect(setConfig).toHaveBeenCalledTimes(1);
  expect(getCommittedConfig(0).chapters[0].title).toBe('Updated title');
});

test('ChapterForm commits the latest buffered title changes on blur', async () => {
  await renderChapterForm();

  const titleInput = screen.getByRole('textbox', { name: 'Chapter title' });

  await act(async () =>
    fireEvent.change(titleInput, {
      target: { value: 'Blurred title' },
    })
  );

  expect(setConfig).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.blur(titleInput);
  });

  expect(setConfig).toHaveBeenCalledTimes(1);
  expect(getCommittedConfig(0).chapters[0].title).toBe('Blurred title');
});

test('ChapterForm flushes pending description changes on unmount', async () => {
  const view = await renderChapterForm();

  await act(async () =>
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Chapter description' }),
      {
        target: { value: 'Updated description' },
      }
    )
  );

  expect(setConfig).not.toHaveBeenCalled();

  await act(async () => {
    view.unmount();
  });

  expect(setConfig).toHaveBeenCalledTimes(1);
  expect(getCommittedConfig(0).chapters[0].description).toBe(
    'Updated description'
  );
});

test('ChapterForm preserves dirty buffered fields until the record catches up', async () => {
  const view = await renderChapterForm();

  await act(async () =>
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Chapter description' }),
      {
        target: { value: 'Local description' },
      }
    )
  );

  await act(async () => {
    view.rerender(
      <BufferedChapterForm
        theme="dark"
        record={{
          ...baseRecord,
          title: 'Server title',
          description: 'Server description',
        }}
      />
    );
  });

  expect(screen.getByRole('textbox', { name: 'Chapter title' })).toHaveValue(
    'Server title'
  );
  expect(
    screen.getByRole('textbox', { name: 'Chapter description' })
  ).toHaveValue('Local description');

  await act(async () => {
    view.rerender(
      <BufferedChapterForm
        theme="dark"
        record={{
          ...baseRecord,
          title: 'Server title',
          description: 'Local description',
        }}
      />
    );
  });

  await act(async () => {
    view.rerender(
      <BufferedChapterForm
        theme="dark"
        record={{
          ...baseRecord,
          title: 'Server title',
          description: 'Canonical description',
        }}
      />
    );
  });

  expect(
    screen.getByRole('textbox', { name: 'Chapter description' })
  ).toHaveValue('Canonical description');

  await act(async () => {
    view.unmount();
  });
});

test('ChapterForm updates alignment locally and commits it', async () => {
  await renderChapterForm();

  const chapterSection = screen.getByRole('region', {
    name: 'Chapter: Chapter 1',
  });

  expect(chapterSection).toHaveClass('lefty');

  await act(async () => {
    fireEvent.click(screen.getByTitle('Align Center'));
  });

  expect(chapterSection).toHaveClass('centered');
  expect(setConfig).toHaveBeenCalledTimes(1);
  expect(getCommittedConfig(0).chapters[0].alignment).toBe('center');
});
