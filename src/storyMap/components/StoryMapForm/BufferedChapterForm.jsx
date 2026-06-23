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

import ChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/ChapterForm';
import useBufferedChapterFields, {
  BUFFERED_FIELD_COMMIT_STRATEGIES,
} from 'terraso-web-client/storyMap/components/StoryMapForm/useBufferedChapterFields';

const TEXT_COMMIT_DEBOUNCE = 500;
const BUFFERED_CHAPTER_FIELDS = {
  title: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED,
    delayMs: TEXT_COMMIT_DEBOUNCE,
  },
  description: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED,
    delayMs: TEXT_COMMIT_DEBOUNCE,
  },
  alignment: {
    commitStrategy: BUFFERED_FIELD_COMMIT_STRATEGIES.IMMEDIATE,
  },
};

const BufferedChapterForm = ({ record: persistedChapter }) => {
  const { chapter, getFieldBlurHandler, getFieldChangeHandler } =
    useBufferedChapterFields({
      chapter: persistedChapter,
      bufferedFields: BUFFERED_CHAPTER_FIELDS,
    });

  return (
    <ChapterForm
      record={chapter}
      onFieldChange={getFieldChangeHandler}
      onFieldBlur={getFieldBlurHandler}
    />
  );
};

export default BufferedChapterForm;
