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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';

import {
  useStoryMapBufferedChapterActionsContext,
  useStoryMapConfigActionsContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

export const BUFFERED_FIELD_COMMIT_STRATEGIES = {
  DEBOUNCED: 'debounced',
  IMMEDIATE: 'immediate',
};

const getBufferedFieldPersistOptions = fieldConfig => {
  switch (fieldConfig?.commitStrategy) {
    case BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED:
      return { delayMs: fieldConfig.delayMs };
    case BUFFERED_FIELD_COMMIT_STRATEGIES.IMMEDIATE:
    default:
      return {};
  }
};

const shouldFlushBufferedFieldOnBlur = fieldConfig =>
  fieldConfig?.commitStrategy === BUFFERED_FIELD_COMMIT_STRATEGIES.DEBOUNCED;

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

const useBufferedChapterState = ({
  persistedChapter,
  bufferedFieldNames,
  setChapterHasBufferedChanges,
}) => {
  const [bufferedFieldValues, setBufferedFieldValues] = useState(() =>
    pickBufferedFieldValues(persistedChapter, bufferedFieldNames)
  );
  const bufferedChapterStateRef = useRef({
    bufferedFieldValues: pickBufferedFieldValues(
      persistedChapter,
      bufferedFieldNames
    ),
    chapter: persistedChapter,
  });
  const previousChapterRef = useRef(persistedChapter);

  const chapter = useMemo(
    () => ({
      ...persistedChapter,
      ...bufferedFieldValues,
    }),
    [bufferedFieldValues, persistedChapter]
  );

  const pendingBufferedFieldPatch = useMemo(
    () =>
      buildBufferedFieldPatch(
        bufferedFieldValues,
        persistedChapter,
        bufferedFieldNames
      ),
    [bufferedFieldNames, bufferedFieldValues, persistedChapter]
  );
  const hasPendingBufferedFieldChanges = !_.isEmpty(pendingBufferedFieldPatch);

  const syncBufferedChapterState = useCallback(
    nextBufferedFieldValues => {
      bufferedChapterStateRef.current = {
        bufferedFieldValues: nextBufferedFieldValues,
        chapter: persistedChapter,
      };
    },
    [persistedChapter]
  );

  const updateBufferedFieldValues = useCallback(
    nextBufferedFieldValues => {
      syncBufferedChapterState(nextBufferedFieldValues);
      setBufferedFieldValues(nextBufferedFieldValues);
    },
    [syncBufferedChapterState]
  );

  const readBufferedChapterState = useCallback(
    () => bufferedChapterStateRef.current,
    []
  );

  useLayoutEffect(() => {
    syncBufferedChapterState(bufferedFieldValues);
  }, [bufferedFieldValues, syncBufferedChapterState]);

  useEffect(() => {
    const previousChapter = previousChapterRef.current;

    setBufferedFieldValues(currentBufferedFieldValues => {
      if (persistedChapter.id !== previousChapter.id) {
        return pickBufferedFieldValues(persistedChapter, bufferedFieldNames);
      }

      return reconcileBufferedFieldValuesWithChapter({
        currentBufferedFieldValues,
        previousChapter,
        nextChapter: persistedChapter,
        bufferedFieldNames,
      });
    });

    previousChapterRef.current = persistedChapter;
  }, [bufferedFieldNames, persistedChapter]);

  useEffect(() => {
    setChapterHasBufferedChanges(
      persistedChapter.id,
      hasPendingBufferedFieldChanges
    );
  }, [
    hasPendingBufferedFieldChanges,
    persistedChapter.id,
    setChapterHasBufferedChanges,
  ]);

  useEffect(
    () => () => {
      setChapterHasBufferedChanges(persistedChapter.id, false);
    },
    [persistedChapter.id, setChapterHasBufferedChanges]
  );

  return {
    chapter,
    readBufferedChapterState,
    updateBufferedFieldValues,
  };
};

const useBufferedFieldPersistence = ({
  bufferedFieldNames,
  readBufferedChapterState,
  updateConfig,
}) => {
  const scheduledFieldPersistsRef = useRef(new Map());

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
    } = readBufferedChapterState();

    return buildBufferedFieldPatch(
      currentBufferedFieldValues,
      currentChapter,
      bufferedFieldNames
    );
  }, [bufferedFieldNames, readBufferedChapterState]);

  const persistBufferedFieldPatch = useCallback(
    (nextChapterFields, { defer = true } = {}) => {
      const { chapter: currentChapter } = readBufferedChapterState();
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
    [readBufferedChapterState, updateConfig]
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

  const buildBufferedChapterConfigUpdater = useCallback(() => {
    clearScheduledFieldPersists();
    const nextChapterFields = readPendingBufferedFieldPatch();

    if (_.isEmpty(nextChapterFields)) {
      return null;
    }

    const { chapter: currentChapter } = readBufferedChapterState();

    return buildChapterConfigUpdater(currentChapter.id, nextChapterFields);
  }, [
    clearScheduledFieldPersists,
    readBufferedChapterState,
    readPendingBufferedFieldPatch,
  ]);

  return {
    buildBufferedChapterConfigUpdater,
    clearScheduledFieldPersists,
    persistBufferedFieldPatch,
    readPendingBufferedFieldPatch,
    scheduleBufferedFieldPersist,
  };
};

const useBufferedChapterLifecycle = ({
  persistedChapterId,
  registerBufferedChapterUpdateBuilder,
  buildBufferedChapterConfigUpdater,
  clearScheduledFieldPersists,
  persistBufferedFieldPatch,
  readPendingBufferedFieldPatch,
}) => {
  useEffect(
    () =>
      registerBufferedChapterUpdateBuilder(
        persistedChapterId,
        buildBufferedChapterConfigUpdater
      ),
    [
      persistedChapterId,
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
};

const useBufferedChapterFields = props => {
  const { chapter: persistedChapter, bufferedFields } = props;
  const { setConfig: updateConfig } = useStoryMapConfigActionsContext();
  const { setChapterHasBufferedChanges, registerBufferedChapterUpdateBuilder } =
    useStoryMapBufferedChapterActionsContext();
  const bufferedFieldNames = useMemo(
    () => Object.keys(bufferedFields),
    [bufferedFields]
  );
  const { chapter, readBufferedChapterState, updateBufferedFieldValues } =
    useBufferedChapterState({
      persistedChapter,
      bufferedFieldNames,
      setChapterHasBufferedChanges,
    });
  const {
    buildBufferedChapterConfigUpdater,
    clearScheduledFieldPersists,
    persistBufferedFieldPatch,
    readPendingBufferedFieldPatch,
    scheduleBufferedFieldPersist,
  } = useBufferedFieldPersistence({
    bufferedFieldNames,
    readBufferedChapterState,
    updateConfig,
  });

  useBufferedChapterLifecycle({
    persistedChapterId: persistedChapter.id,
    registerBufferedChapterUpdateBuilder,
    buildBufferedChapterConfigUpdater,
    clearScheduledFieldPersists,
    persistBufferedFieldPatch,
    readPendingBufferedFieldPatch,
  });

  const applyImmediateFieldChange = useCallback(
    (fieldName, value) => {
      updateConfig(
        buildChapterConfigUpdater(persistedChapter.id, { [fieldName]: value })
      );
    },
    [persistedChapter.id, updateConfig]
  );

  const handleFieldChange = useCallback(
    (fieldName, value) => {
      const bufferedFieldConfig = bufferedFields[fieldName];

      if (!bufferedFieldConfig) {
        applyImmediateFieldChange(fieldName, value);
        return;
      }

      const currentBufferedFieldValues =
        readBufferedChapterState().bufferedFieldValues;
      if (areFieldValuesEqual(currentBufferedFieldValues[fieldName], value)) {
        return;
      }

      const nextBufferedFieldValues = {
        ...currentBufferedFieldValues,
        [fieldName]: value,
      };

      updateBufferedFieldValues(nextBufferedFieldValues);

      scheduleBufferedFieldPersist(
        fieldName,
        value,
        getBufferedFieldPersistOptions(bufferedFieldConfig)
      );
    },
    [
      applyImmediateFieldChange,
      bufferedFields,
      readBufferedChapterState,
      scheduleBufferedFieldPersist,
      updateBufferedFieldValues,
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
      const bufferedFieldConfig = bufferedFields[fieldName];

      if (!shouldFlushBufferedFieldOnBlur(bufferedFieldConfig)) {
        return undefined;
      }

      return () => {
        scheduleBufferedFieldPersist(
          fieldName,
          readBufferedChapterState().bufferedFieldValues[fieldName]
        );
      };
    },
    [bufferedFields, readBufferedChapterState, scheduleBufferedFieldPersist]
  );

  return {
    chapter,
    getFieldBlurHandler,
    getFieldChangeHandler,
  };
};

export default useBufferedChapterFields;
