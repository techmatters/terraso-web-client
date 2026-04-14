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
import useBufferedConfigFields from 'terraso-web-client/storyMap/components/StoryMapForm/useBufferedConfigFields';

const TEXT_COMMIT_DEBOUNCE = 500;
const BUFFERED_CHANGE_FIELDS = ['title', 'description', 'alignment'];

const buildChapterConfigUpdater = (record, nextFields) => config => ({
  ...config,
  chapters: config.chapters.map(chapter =>
    chapter.id === record.id ? { ...chapter, ...nextFields } : chapter
  ),
});

const BufferedChapterForm = ({ theme, record }) => {
  const {
    setConfig,
    init,
    setBufferedChapterChangesPending,
    registerBufferedChapterChangesFlusher,
    getConfig,
  } = useStoryMapConfigActionsContext();
  const {
    bufferedValues,
    effectiveEntity: effectiveRecord,
    commitBufferedField,
    getBufferedFieldBlurHandler,
    scheduleBufferedFieldCommit,
    updateBufferedField,
  } = useBufferedConfigFields({
    buildConfigUpdater: buildChapterConfigUpdater,
    entity: record,
    fields: BUFFERED_CHANGE_FIELDS,
    setBufferedChapterChangesPending,
    registerFlusher: registerBufferedChapterChangesFlusher,
    setConfig,
  });

  const onFieldChange = useCallback(
    field => value => {
      if (field === 'title' || field === 'description') {
        updateBufferedField(field, value);
        scheduleBufferedFieldCommit(field, value, TEXT_COMMIT_DEBOUNCE);
        return;
      }

      if (field === 'alignment') {
        updateBufferedField(field, value);
        commitBufferedField(field, value);
        return;
      }

      setConfig(config => ({
        ...config,
        chapters: config.chapters.map(chapter =>
          chapter.id === record.id ? { ...chapter, [field]: value } : chapter
        ),
      }));
    },
    [
      commitBufferedField,
      record.id,
      scheduleBufferedFieldCommit,
      setConfig,
      updateBufferedField,
    ]
  );

  return (
    <ChapterForm
      theme={theme}
      record={record}
      effectiveRecord={effectiveRecord}
      bufferedValues={bufferedValues}
      init={init}
      setConfig={setConfig}
      getConfig={getConfig}
      onFieldChange={onFieldChange}
      onFieldBlur={getBufferedFieldBlurHandler}
    />
  );
};

export default BufferedChapterForm;
