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

import { useCallback } from 'react';

import ChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/ChapterForm';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import useBufferedChapterFields from 'terraso-web-client/storyMap/components/StoryMapForm/useBufferedChapterFields';

const TEXT_COMMIT_DEBOUNCE = 500;
const BUFFERED_CHAPTER_FIELDS = ['title', 'description', 'alignment'];
const BUFFERED_CHAPTER_FIELD_COMMIT_OPTIONS = {
  title: { delayMs: TEXT_COMMIT_DEBOUNCE },
  description: { delayMs: TEXT_COMMIT_DEBOUNCE },
};

const buildChapterConfigUpdater = (chapter, nextChapterFields) => config => ({
  ...config,
  chapters: config.chapters.map(configChapter =>
    configChapter.id === chapter.id
      ? { ...configChapter, ...nextChapterFields }
      : configChapter
  ),
});

const applyChapterFieldChange = (chapterId, fieldName, value) => config => ({
  ...config,
  chapters: config.chapters.map(chapter =>
    chapter.id === chapterId ? { ...chapter, [fieldName]: value } : chapter
  ),
});

const BufferedChapterForm = ({ theme, record: chapter }) => {
  const {
    setConfig,
    init,
    setBufferedChapterChangesPending,
    registerBufferedChapterChangesFlusher,
    getConfig,
  } = useStoryMapConfigActionsContext();
  const {
    bufferedChapterValues,
    effectiveChapter,
    commitBufferedChapterField,
    getBufferedChapterFieldBlurHandler,
    updateBufferedChapterField,
  } = useBufferedChapterFields({
    buildChapterConfigUpdater,
    chapter,
    bufferedFieldNames: BUFFERED_CHAPTER_FIELDS,
    setBufferedChapterChangesPending,
    registerBufferedChapterChangesFlusher,
    setConfig,
  });

  const onFieldChange = useCallback(
    fieldName => value => {
      if (BUFFERED_CHAPTER_FIELDS.includes(fieldName)) {
        updateBufferedChapterField(fieldName, value);
        commitBufferedChapterField(
          fieldName,
          value,
          BUFFERED_CHAPTER_FIELD_COMMIT_OPTIONS[fieldName]
        );
        return;
      }

      setConfig(applyChapterFieldChange(chapter.id, fieldName, value));
    },
    [
      chapter.id,
      commitBufferedChapterField,
      setConfig,
      updateBufferedChapterField,
    ]
  );

  return (
    <ChapterForm
      theme={theme}
      record={chapter}
      effectiveRecord={effectiveChapter}
      bufferedValues={bufferedChapterValues}
      init={init}
      setConfig={setConfig}
      getConfig={getConfig}
      onFieldChange={onFieldChange}
      onFieldBlur={getBufferedChapterFieldBlurHandler}
    />
  );
};

export default BufferedChapterForm;
