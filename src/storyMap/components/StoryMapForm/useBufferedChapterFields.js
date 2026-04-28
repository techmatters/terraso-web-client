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

const areFieldValuesEqual = (leftValue, rightValue) =>
  _.isEqual(leftValue, rightValue);

const getBufferedChapterValues = (chapter, bufferedFieldNames) =>
  bufferedFieldNames.reduce(
    (nextValues, fieldName) => ({
      ...nextValues,
      [fieldName]: chapter[fieldName],
    }),
    {}
  );

const getChangedChapterFields = (
  bufferedChapterValues,
  chapter,
  bufferedFieldNames
) =>
  Object.fromEntries(
    bufferedFieldNames.flatMap(fieldName =>
      areFieldValuesEqual(bufferedChapterValues[fieldName], chapter[fieldName])
        ? []
        : [[fieldName, bufferedChapterValues[fieldName]]]
    )
  );

const filterChangedChapterFields = (nextChapterFields, chapter) =>
  Object.fromEntries(
    Object.entries(nextChapterFields).filter(
      ([fieldName, value]) => !areFieldValuesEqual(chapter[fieldName], value)
    )
  );

const shouldSyncBufferedChapterField = ({
  currentBufferedChapterValues,
  previousChapter,
  nextChapter,
  fieldName,
}) =>
  !areFieldValuesEqual(nextChapter[fieldName], previousChapter[fieldName]) &&
  areFieldValuesEqual(
    currentBufferedChapterValues[fieldName],
    previousChapter[fieldName]
  );

const reconcileBufferedChapterValues = ({
  currentBufferedChapterValues,
  previousChapter,
  nextChapter,
  bufferedFieldNames,
}) => {
  const syncedChapterFields = Object.fromEntries(
    bufferedFieldNames.flatMap(fieldName =>
      shouldSyncBufferedChapterField({
        currentBufferedChapterValues,
        previousChapter,
        nextChapter,
        fieldName,
      })
        ? [[fieldName, nextChapter[fieldName]]]
        : []
    )
  );

  return _.isEmpty(syncedChapterFields)
    ? currentBufferedChapterValues
    : {
        ...currentBufferedChapterValues,
        ...syncedChapterFields,
      };
};

const removeScheduledCommit = (scheduledCommits, fieldName) => {
  const nextScheduledCommits = new Map(scheduledCommits);
  nextScheduledCommits.delete(fieldName);
  return nextScheduledCommits;
};

const addScheduledCommit = (scheduledCommits, fieldName, pendingCommit) =>
  new Map([...scheduledCommits, [fieldName, pendingCommit]]);

const useBufferedChapterFields = props => {
  const {
    buildChapterConfigUpdater,
    chapter,
    bufferedFieldNames,
    setBufferedChapterChangesPending,
    registerBufferedChapterChangesFlusher,
    setConfig,
  } = props;
  const [bufferedChapterValues, setBufferedChapterValues] = useState(() =>
    getBufferedChapterValues(chapter, bufferedFieldNames)
  );
  const latestChapterSnapshotRef = useRef({
    bufferedChapterValues,
    chapter,
  });
  const previousChapterRef = useRef(chapter);
  const commitTimeoutsRef = useRef(new Map());

  const effectiveChapter = useMemo(
    () => ({
      ...chapter,
      ...bufferedChapterValues,
    }),
    [bufferedChapterValues, chapter]
  );

  const bufferedChapterFieldChanges = useMemo(
    () =>
      getChangedChapterFields(
        bufferedChapterValues,
        chapter,
        bufferedFieldNames
      ),
    [bufferedChapterValues, chapter, bufferedFieldNames]
  );

  useEffect(() => {
    latestChapterSnapshotRef.current = {
      bufferedChapterValues,
      chapter,
    };
  }, [bufferedChapterValues, chapter]);

  useEffect(() => {
    const previousChapter = previousChapterRef.current;

    setBufferedChapterValues(currentBufferedChapterValues => {
      if (chapter.id !== previousChapter.id) {
        return getBufferedChapterValues(chapter, bufferedFieldNames);
      }

      return reconcileBufferedChapterValues({
        currentBufferedChapterValues,
        previousChapter,
        nextChapter: chapter,
        bufferedFieldNames,
      });
    });

    previousChapterRef.current = chapter;
  }, [chapter, bufferedFieldNames]);

  useEffect(() => {
    setBufferedChapterChangesPending(
      chapter.id,
      !_.isEmpty(bufferedChapterFieldChanges)
    );
  }, [
    bufferedChapterFieldChanges,
    chapter.id,
    setBufferedChapterChangesPending,
  ]);

  useEffect(
    () => () => {
      setBufferedChapterChangesPending(chapter.id, false);
    },
    [chapter.id, setBufferedChapterChangesPending]
  );

  const clearScheduledCommit = useCallback(fieldName => {
    const pendingFieldCommit = commitTimeoutsRef.current.get(fieldName);
    if (!pendingFieldCommit) {
      return;
    }

    clearTimeout(pendingFieldCommit.timeoutId);

    commitTimeoutsRef.current = removeScheduledCommit(
      commitTimeoutsRef.current,
      fieldName
    );
  }, []);

  const clearScheduledCommits = useCallback(() => {
    commitTimeoutsRef.current.forEach(pendingFieldCommit => {
      clearTimeout(pendingFieldCommit.timeoutId);
    });

    commitTimeoutsRef.current = new Map();
  }, []);

  const getBufferedChapterFieldChanges = useCallback(() => {
    const {
      bufferedChapterValues: currentBufferedChapterValues,
      chapter: currentChapter,
    } = latestChapterSnapshotRef.current;

    return getChangedChapterFields(
      currentBufferedChapterValues,
      currentChapter,
      bufferedFieldNames
    );
  }, [bufferedFieldNames]);

  const commitBufferedChapterFields = useCallback(
    (nextChapterFields, { defer = true } = {}) => {
      const { chapter: currentChapter } = latestChapterSnapshotRef.current;
      const changedChapterFields = filterChangedChapterFields(
        nextChapterFields,
        currentChapter
      );

      if (_.isEmpty(changedChapterFields)) {
        return;
      }

      const configUpdater = buildChapterConfigUpdater(
        currentChapter,
        changedChapterFields
      );

      if (!defer) {
        setConfig(configUpdater);
        return;
      }

      startTransition(() => {
        setConfig(configUpdater);
      });
    },
    [buildChapterConfigUpdater, setConfig]
  );

  const flushBufferedChapterChanges = useCallback(() => {
    clearScheduledCommits();
    const nextChapterFields = getBufferedChapterFieldChanges();

    if (_.isEmpty(nextChapterFields)) {
      return null;
    }

    return buildChapterConfigUpdater(
      latestChapterSnapshotRef.current.chapter,
      nextChapterFields
    );
  }, [
    buildChapterConfigUpdater,
    clearScheduledCommits,
    getBufferedChapterFieldChanges,
  ]);

  useEffect(
    () =>
      registerBufferedChapterChangesFlusher(
        chapter.id,
        flushBufferedChapterChanges
      ),
    [
      chapter.id,
      flushBufferedChapterChanges,
      registerBufferedChapterChangesFlusher,
    ]
  );

  useEffect(
    () => () => {
      clearScheduledCommits();
      commitBufferedChapterFields(getBufferedChapterFieldChanges(), {
        defer: false,
      });
    },
    [
      clearScheduledCommits,
      commitBufferedChapterFields,
      getBufferedChapterFieldChanges,
    ]
  );

  const commitBufferedChapterField = useCallback(
    (fieldName, value, { delayMs = 0, ...options } = {}) => {
      clearScheduledCommit(fieldName);

      if (delayMs <= 0) {
        commitBufferedChapterFields({ [fieldName]: value }, options);
        return;
      }

      const timeoutId = setTimeout(() => {
        commitTimeoutsRef.current = removeScheduledCommit(
          commitTimeoutsRef.current,
          fieldName
        );
        commitBufferedChapterFields({ [fieldName]: value }, options);
      }, delayMs);

      commitTimeoutsRef.current = addScheduledCommit(
        commitTimeoutsRef.current,
        fieldName,
        { timeoutId }
      );
    },
    [clearScheduledCommit, commitBufferedChapterFields]
  );

  const updateBufferedChapterField = useCallback((fieldName, value) => {
    setBufferedChapterValues(currentBufferedChapterValues => {
      if (areFieldValuesEqual(currentBufferedChapterValues[fieldName], value)) {
        return currentBufferedChapterValues;
      }

      return {
        ...currentBufferedChapterValues,
        [fieldName]: value,
      };
    });
  }, []);

  const getBufferedChapterFieldBlurHandler = useCallback(
    fieldName => () => {
      commitBufferedChapterField(
        fieldName,
        latestChapterSnapshotRef.current.bufferedChapterValues[fieldName]
      );
    },
    [commitBufferedChapterField]
  );

  return {
    bufferedChapterValues,
    effectiveChapter,
    commitBufferedChapterField,
    getBufferedChapterFieldBlurHandler,
    updateBufferedChapterField,
  };
};

export default useBufferedChapterFields;
