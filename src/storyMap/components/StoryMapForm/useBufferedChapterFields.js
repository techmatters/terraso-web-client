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

const buildChapterFieldUpdater = (chapterId, nextChapterFields) => config => ({
  ...config,
  chapters: config.chapters.map(configChapter =>
    configChapter.id === chapterId
      ? { ...configChapter, ...nextChapterFields }
      : configChapter
  ),
});

const pickInitialBufferedFieldValues = (chapter, bufferedFieldNames) =>
  bufferedFieldNames.reduce(
    (nextValues, fieldName) => ({
      ...nextValues,
      [fieldName]: chapter[fieldName],
    }),
    {}
  );

const calculateBufferedFieldChanges = (
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

const getPersistableFieldChanges = (nextChapterFields, chapter) =>
  Object.fromEntries(
    Object.entries(nextChapterFields).filter(
      ([fieldName, value]) => !areFieldValuesEqual(chapter[fieldName], value)
    )
  );

const shouldRefreshBufferedFieldValue = ({
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

const reconcileBufferedFieldValues = ({
  currentBufferedFieldValues,
  previousChapter,
  nextChapter,
  bufferedFieldNames,
}) => {
  const refreshedFieldValues = Object.fromEntries(
    bufferedFieldNames.flatMap(fieldName =>
      shouldRefreshBufferedFieldValue({
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
    setConfig,
    setChapterHasBufferedChanges,
    registerBufferedChapterUpdateBuilder,
  } = useStoryMapConfigActionsContext();
  const bufferedFieldNames = useMemo(
    () => Object.keys(bufferedFieldBehavior),
    [bufferedFieldBehavior]
  );
  const [bufferedFieldValues, setBufferedFieldValues] = useState(() =>
    pickInitialBufferedFieldValues(chapter, bufferedFieldNames)
  );
  const latestBufferedSnapshotRef = useRef({
    bufferedFieldValues,
    chapter,
  });
  const previousChapterRef = useRef(chapter);
  const scheduledFieldCommitsRef = useRef(new Map());

  const displayedChapter = useMemo(
    () => ({
      ...chapter,
      ...bufferedFieldValues,
    }),
    [bufferedFieldValues, chapter]
  );

  const pendingBufferedFieldChanges = useMemo(
    () =>
      calculateBufferedFieldChanges(
        bufferedFieldValues,
        chapter,
        bufferedFieldNames
      ),
    [bufferedFieldValues, chapter, bufferedFieldNames]
  );
  const hasPendingBufferedFieldChanges = !_.isEmpty(
    pendingBufferedFieldChanges
  );

  useEffect(() => {
    latestBufferedSnapshotRef.current = {
      bufferedFieldValues,
      chapter,
    };
  }, [bufferedFieldValues, chapter]);

  useEffect(() => {
    const previousChapter = previousChapterRef.current;

    setBufferedFieldValues(currentBufferedFieldValues => {
      if (chapter.id !== previousChapter.id) {
        return pickInitialBufferedFieldValues(chapter, bufferedFieldNames);
      }

      return reconcileBufferedFieldValues({
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

  const cancelScheduledFieldCommit = useCallback(fieldName => {
    const pendingFieldCommit = scheduledFieldCommitsRef.current.get(fieldName);
    if (!pendingFieldCommit) {
      return;
    }

    clearTimeout(pendingFieldCommit.timeoutId);

    scheduledFieldCommitsRef.current.delete(fieldName);
  }, []);

  const clearScheduledFieldCommits = useCallback(() => {
    scheduledFieldCommitsRef.current.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });

    scheduledFieldCommitsRef.current.clear();
  }, []);

  const readPendingBufferedFieldChanges = useCallback(() => {
    const {
      bufferedFieldValues: currentBufferedFieldValues,
      chapter: currentChapter,
    } = latestBufferedSnapshotRef.current;

    return calculateBufferedFieldChanges(
      currentBufferedFieldValues,
      currentChapter,
      bufferedFieldNames
    );
  }, [bufferedFieldNames]);

  const persistBufferedFieldChanges = useCallback(
    (nextChapterFields, { defer = true } = {}) => {
      const { chapter: currentChapter } = latestBufferedSnapshotRef.current;
      const persistableFieldChanges = getPersistableFieldChanges(
        nextChapterFields,
        currentChapter
      );

      if (_.isEmpty(persistableFieldChanges)) {
        return;
      }

      const configUpdater = buildChapterFieldUpdater(
        currentChapter.id,
        persistableFieldChanges
      );

      if (!defer) {
        setConfig(configUpdater);
        return;
      }

      startTransition(() => {
        setConfig(configUpdater);
      });
    },
    [setConfig]
  );

  const buildBufferedChapterUpdate = useCallback(() => {
    clearScheduledFieldCommits();
    const nextChapterFields = readPendingBufferedFieldChanges();

    if (_.isEmpty(nextChapterFields)) {
      return null;
    }

    const { chapter: currentChapter } = latestBufferedSnapshotRef.current;

    return buildChapterFieldUpdater(currentChapter.id, nextChapterFields);
  }, [clearScheduledFieldCommits, readPendingBufferedFieldChanges]);

  useEffect(
    () =>
      registerBufferedChapterUpdateBuilder(
        chapter.id,
        buildBufferedChapterUpdate
      ),
    [
      chapter.id,
      buildBufferedChapterUpdate,
      registerBufferedChapterUpdateBuilder,
    ]
  );

  useEffect(
    () => () => {
      clearScheduledFieldCommits();
      persistBufferedFieldChanges(readPendingBufferedFieldChanges(), {
        defer: false,
      });
    },
    [
      clearScheduledFieldCommits,
      persistBufferedFieldChanges,
      readPendingBufferedFieldChanges,
    ]
  );

  const scheduleBufferedFieldPersist = useCallback(
    (fieldName, value, { delayMs = 0, ...options } = {}) => {
      cancelScheduledFieldCommit(fieldName);

      if (delayMs <= 0) {
        persistBufferedFieldChanges({ [fieldName]: value }, options);
        return;
      }

      const timeoutId = setTimeout(() => {
        scheduledFieldCommitsRef.current.delete(fieldName);
        persistBufferedFieldChanges({ [fieldName]: value }, options);
      }, delayMs);

      scheduledFieldCommitsRef.current.set(fieldName, { timeoutId });
    },
    [cancelScheduledFieldCommit, persistBufferedFieldChanges]
  );

  const applyImmediateFieldChange = useCallback(
    (fieldName, value) => {
      setConfig(buildChapterFieldUpdater(chapter.id, { [fieldName]: value }));
    },
    [chapter.id, setConfig]
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
          latestBufferedSnapshotRef.current.bufferedFieldValues[fieldName]
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
