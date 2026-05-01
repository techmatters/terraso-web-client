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
const BUFFERED_CHAPTER_FIELD_BEHAVIOR = {
  title: { delayMs: TEXT_COMMIT_DEBOUNCE },
  description: { delayMs: TEXT_COMMIT_DEBOUNCE },
  alignment: {},
};

const BufferedChapterForm = ({ theme, record: persistedChapter }) => {
  const {
    setConfig: updateConfig,
    getConfig: getLatestConfig,
    init,
  } = useStoryMapConfigActionsContext();
  const { displayedChapter, getFieldBlurHandler, getFieldChangeHandler } =
    useBufferedChapterFields({
      chapter: persistedChapter,
      bufferedFieldBehavior: BUFFERED_CHAPTER_FIELD_BEHAVIOR,
    });

  return (
    <ChapterForm
      theme={theme}
      persistedChapter={persistedChapter}
      displayedChapter={displayedChapter}
      init={init}
      updateConfig={updateConfig}
      getLatestConfig={getLatestConfig}
      getFieldChangeHandler={getFieldChangeHandler}
      getFieldBlurHandler={getFieldBlurHandler}
    />
  );
};

export default BufferedChapterForm;
