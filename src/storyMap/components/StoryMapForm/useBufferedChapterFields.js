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

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';

import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

const areFieldValuesEqual = (leftValue, rightValue) =>
  _.isEqual(leftValue, rightValue);

const buildChapterConfigUpdater = (chapterId, nextChapterFields) => config => ({
  ...config,
  chapters: config.chapters.map(configChapter =>
    configChapter.id === chapterId
      ? { ...configChapter, ...nextChapterFields }
      : configChapter
  ),
});

const pickBufferedFieldValues = (chapter, bufferedFieldNames) =>
  bufferedFieldNames.reduce(
    (nextValues, fieldName) => ({
      ...nextValues,
      [fieldName]: chapter[fieldName],
    }),
    {}
  );

const buildBufferedFieldPatch = (
  bufferedFieldValues,
  chapter,
  bufferedFieldNames
) =>
  Object.fromEntries(
    bufferedFieldNames.flatMap(fieldName =>
      areFieldValuesEqual(bufferedFieldValues[fieldName], chapter[fieldName])
        ? []
        : [[fieldName, bufferedFieldValues[fieldName]]]
    )
  );

const buildPersistableFieldPatch = (nextChapterFields, chapter) =>
  Object.fromEntries(
    Object.entries(nextChapterFields).filter(
      ([fieldName, value]) => !areFieldValuesEqual(chapter[fieldName], value)
    )
  );

const shouldRefreshBufferedValueFromChapter = ({
  currentBufferedFieldValues,
  previousChapter,
  nextChapter,
  fieldName,
}) =>
  !areFieldValuesEqual(nextChapter[fieldName], previousChapter[fieldName]) &&
  areFieldValuesEqual(
    currentBufferedFieldValues[fieldName],
    previousChapter[fieldName]
  );

const reconcileBufferedFieldValuesWithChapter = ({
  currentBufferedFieldValues,
  previousChapter,
  nextChapter,
  bufferedFieldNames,
}) => {
  const refreshedFieldValues = Object.fromEntries(
    bufferedFieldNames.flatMap(fieldName =>
      shouldRefreshBufferedValueFromChapter({
        currentBufferedFieldValues,
        previousChapter,
        nextChapter,
        fieldName,
      })
        ? [[fieldName, nextChapter[fieldName]]]
        : []
    )
  );

  return _.isEmpty(refreshedFieldValues)
    ? currentBufferedFieldValues
    : {
        ...currentBufferedFieldValues,
        ...refreshedFieldValues,
      };
};

const useBufferedChapterFields = props => {
  const { chapter, bufferedFieldBehavior } = props;
  const {
    setConfig: updateConfig,
    setChapterHasBufferedChanges,
    registerBufferedChapterUpdateBuilder,
  } = useStoryMapConfigActionsContext();
  const bufferedFieldNames = useMemo(
    () => Object.keys(bufferedFieldBehavior),
    [bufferedFieldBehavior]
  );
  const [bufferedFieldValues, setBufferedFieldValues] = useState(() =>
    pickBufferedFieldValues(chapter, bufferedFieldNames)
  );
  const latestBufferedStateRef = useRef({
    bufferedFieldValues,
    chapter,
  });
  const previousChapterRef = useRef(chapter);
  const scheduledFieldPersistsRef = useRef(new Map());

  const displayedChapter = useMemo(
    () => ({
      ...chapter,
      ...bufferedFieldValues,
    }),
    [bufferedFieldValues, chapter]
  );

  const pendingBufferedFieldPatch = useMemo(
    () =>
      buildBufferedFieldPatch(bufferedFieldValues, chapter, bufferedFieldNames),
    [bufferedFieldValues, chapter, bufferedFieldNames]
  );
  const hasPendingBufferedFieldChanges = !_.isEmpty(pendingBufferedFieldPatch);

  useEffect(() => {
    latestBufferedStateRef.current = {
      bufferedFieldValues,
      chapter,
    };
  }, [bufferedFieldValues, chapter]);

  useEffect(() => {
    const previousChapter = previousChapterRef.current;

    setBufferedFieldValues(currentBufferedFieldValues => {
      if (chapter.id !== previousChapter.id) {
        return pickBufferedFieldValues(chapter, bufferedFieldNames);
      }

      return reconcileBufferedFieldValuesWithChapter({
        currentBufferedFieldValues,
        previousChapter,
        nextChapter: chapter,
        bufferedFieldNames,
      });
    });

    previousChapterRef.current = chapter;
  }, [chapter, bufferedFieldNames]);

  useEffect(() => {
    setChapterHasBufferedChanges(chapter.id, hasPendingBufferedFieldChanges);
  }, [
    hasPendingBufferedFieldChanges,
    chapter.id,
    setChapterHasBufferedChanges,
  ]);

  useEffect(
    () => () => {
      setChapterHasBufferedChanges(chapter.id, false);
    },
    [chapter.id, setChapterHasBufferedChanges]
  );

  const cancelScheduledFieldPersist = useCallback(fieldName => {
    const pendingFieldPersist =
      scheduledFieldPersistsRef.current.get(fieldName);
    if (!pendingFieldPersist) {
      return;
    }

    clearTimeout(pendingFieldPersist.timeoutId);

    scheduledFieldPersistsRef.current.delete(fieldName);
  }, []);

  const clearScheduledFieldPersists = useCallback(() => {
    scheduledFieldPersistsRef.current.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });

    scheduledFieldPersistsRef.current.clear();
  }, []);

  const readPendingBufferedFieldPatch = useCallback(() => {
    const {
      bufferedFieldValues: currentBufferedFieldValues,
      chapter: currentChapter,
    } = latestBufferedStateRef.current;

    return buildBufferedFieldPatch(
      currentBufferedFieldValues,
      currentChapter,
      bufferedFieldNames
    );
  }, [bufferedFieldNames]);

  const persistBufferedFieldPatch = useCallback(
    (nextChapterFields, { defer = true } = {}) => {
      const { chapter: currentChapter } = latestBufferedStateRef.current;
      const persistableFieldChanges = buildPersistableFieldPatch(
        nextChapterFields,
        currentChapter
      );

      if (_.isEmpty(persistableFieldChanges)) {
        return;
      }

      const configUpdater = buildChapterConfigUpdater(
        currentChapter.id,
        persistableFieldChanges
      );

      if (!defer) {
        updateConfig(configUpdater);
        return;
      }

      startTransition(() => {
        updateConfig(configUpdater);
      });
    },
    [updateConfig]
  );

  const buildBufferedChapterConfigUpdater = useCallback(() => {
    clearScheduledFieldPersists();
    const nextChapterFields = readPendingBufferedFieldPatch();

    if (_.isEmpty(nextChapterFields)) {
      return null;
    }

    const { chapter: currentChapter } = latestBufferedStateRef.current;

    return buildChapterConfigUpdater(currentChapter.id, nextChapterFields);
  }, [clearScheduledFieldPersists, readPendingBufferedFieldPatch]);

  useEffect(
    () =>
      registerBufferedChapterUpdateBuilder(
        chapter.id,
        buildBufferedChapterConfigUpdater
      ),
    [
      chapter.id,
      buildBufferedChapterConfigUpdater,
      registerBufferedChapterUpdateBuilder,
    ]
  );

  useEffect(
    () => () => {
      clearScheduledFieldPersists();
      persistBufferedFieldPatch(readPendingBufferedFieldPatch(), {
        defer: false,
      });
    },
    [
      clearScheduledFieldPersists,
      persistBufferedFieldPatch,
      readPendingBufferedFieldPatch,
    ]
  );

  const scheduleBufferedFieldPersist = useCallback(
    (fieldName, value, { delayMs = 0, ...options } = {}) => {
      cancelScheduledFieldPersist(fieldName);

      if (delayMs <= 0) {
        persistBufferedFieldPatch({ [fieldName]: value }, options);
        return;
      }

      const timeoutId = setTimeout(() => {
        scheduledFieldPersistsRef.current.delete(fieldName);
        persistBufferedFieldPatch({ [fieldName]: value }, options);
      }, delayMs);

      scheduledFieldPersistsRef.current.set(fieldName, { timeoutId });
    },
    [cancelScheduledFieldPersist, persistBufferedFieldPatch]
  );

  const applyImmediateFieldChange = useCallback(
    (fieldName, value) => {
      updateConfig(
        buildChapterConfigUpdater(chapter.id, { [fieldName]: value })
      );
    },
    [chapter.id, updateConfig]
  );

  const handleFieldChange = useCallback(
    (fieldName, value) => {
      const fieldBehavior = bufferedFieldBehavior[fieldName];

      if (!fieldBehavior) {
        applyImmediateFieldChange(fieldName, value);
        return;
      }

      setBufferedFieldValues(currentBufferedFieldValues => {
        if (areFieldValuesEqual(currentBufferedFieldValues[fieldName], value)) {
          return currentBufferedFieldValues;
        }

        return {
          ...currentBufferedFieldValues,
          [fieldName]: value,
        };
      });

      scheduleBufferedFieldPersist(fieldName, value, fieldBehavior);
    },
    [
      applyImmediateFieldChange,
      bufferedFieldBehavior,
      scheduleBufferedFieldPersist,
    ]
  );

  const getFieldChangeHandler = useCallback(
    fieldName => value => {
      handleFieldChange(fieldName, value);
    },
    [handleFieldChange]
  );

  const getFieldBlurHandler = useCallback(
    fieldName => {
      if (!bufferedFieldBehavior[fieldName]) {
        return undefined;
      }

      return () => {
        scheduleBufferedFieldPersist(
          fieldName,
          latestBufferedStateRef.current.bufferedFieldValues[fieldName]
        );
      };
    },
    [bufferedFieldBehavior, scheduleBufferedFieldPersist]
  );

  return {
    displayedChapter,
    getFieldBlurHandler,
    getFieldChangeHandler,
  };
};

export default useBufferedChapterFields;
