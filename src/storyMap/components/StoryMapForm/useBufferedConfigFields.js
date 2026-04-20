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

const getBufferedValues = (entity, fields) =>
  fields.reduce(
    (nextValues, field) => ({
      ...nextValues,
      [field]: entity[field],
    }),
    {}
  );

const getChangedFields = (bufferedValues, entity, fields) =>
  Object.fromEntries(
    fields.flatMap(field =>
      areFieldValuesEqual(bufferedValues[field], entity[field])
        ? []
        : [[field, bufferedValues[field]]]
    )
  );

const filterChangedFields = (nextFields, entity) =>
  Object.fromEntries(
    Object.entries(nextFields).filter(
      ([field, value]) => !areFieldValuesEqual(entity[field], value)
    )
  );

const shouldSyncBufferedField = ({
  currentBufferedValues,
  previousEntity,
  nextEntity,
  field,
}) =>
  !areFieldValuesEqual(nextEntity[field], previousEntity[field]) &&
  areFieldValuesEqual(currentBufferedValues[field], previousEntity[field]);

const reconcileBufferedValues = ({
  currentBufferedValues,
  previousEntity,
  nextEntity,
  fields,
}) => {
  const syncedFields = Object.fromEntries(
    fields.flatMap(field =>
      shouldSyncBufferedField({
        currentBufferedValues,
        previousEntity,
        nextEntity,
        field,
      })
        ? [[field, nextEntity[field]]]
        : []
    )
  );

  return _.isEmpty(syncedFields)
    ? currentBufferedValues
    : {
        ...currentBufferedValues,
        ...syncedFields,
      };
};

const removeScheduledCommit = (scheduledCommits, field) => {
  const nextScheduledCommits = new Map(scheduledCommits);
  nextScheduledCommits.delete(field);
  return nextScheduledCommits;
};

const addScheduledCommit = (scheduledCommits, field, pendingCommit) =>
  new Map([...scheduledCommits, [field, pendingCommit]]);

const useBufferedConfigFields = props => {
  const {
    buildConfigUpdater,
    entity,
    fields,
    setBufferedChapterChangesPending,
    registerFlusher,
    setConfig,
  } = props;
  const [bufferedValues, setBufferedValues] = useState(() =>
    getBufferedValues(entity, fields)
  );
  const latestSnapshotRef = useRef({ bufferedValues, entity });
  const previousEntityRef = useRef(entity);
  const commitTimeoutsRef = useRef(new Map());

  const effectiveEntity = useMemo(
    () => ({
      ...entity,
      ...bufferedValues,
    }),
    [bufferedValues, entity]
  );

  const bufferedFieldChanges = useMemo(
    () => getChangedFields(bufferedValues, entity, fields),
    [bufferedValues, entity, fields]
  );

  useEffect(() => {
    latestSnapshotRef.current = {
      bufferedValues,
      entity,
    };
  }, [bufferedValues, entity]);

  useEffect(() => {
    const previousEntity = previousEntityRef.current;

    setBufferedValues(currentBufferedValues => {
      if (entity.id !== previousEntity.id) {
        return getBufferedValues(entity, fields);
      }

      return reconcileBufferedValues({
        currentBufferedValues,
        previousEntity,
        nextEntity: entity,
        fields,
      });
    });

    previousEntityRef.current = entity;
  }, [entity, fields]);

  useEffect(() => {
    setBufferedChapterChangesPending(
      entity.id,
      !_.isEmpty(bufferedFieldChanges)
    );
  }, [bufferedFieldChanges, entity.id, setBufferedChapterChangesPending]);

  useEffect(
    () => () => {
      setBufferedChapterChangesPending(entity.id, false);
    },
    [entity.id, setBufferedChapterChangesPending]
  );

  const clearScheduledCommit = useCallback(field => {
    const pendingFieldCommit = commitTimeoutsRef.current.get(field);
    if (!pendingFieldCommit) {
      return;
    }

    clearTimeout(pendingFieldCommit.timeoutId);

    commitTimeoutsRef.current = removeScheduledCommit(
      commitTimeoutsRef.current,
      field
    );
  }, []);

  const clearScheduledCommits = useCallback(() => {
    commitTimeoutsRef.current.forEach(pendingFieldCommit => {
      clearTimeout(pendingFieldCommit.timeoutId);
    });

    commitTimeoutsRef.current = new Map();
  }, []);

  const getBufferedFieldChanges = useCallback(() => {
    const { bufferedValues: currentBufferedValues, entity: currentEntity } =
      latestSnapshotRef.current;

    return getChangedFields(currentBufferedValues, currentEntity, fields);
  }, [fields]);

  const commitBufferedFields = useCallback(
    (nextFields, { defer = true } = {}) => {
      const { entity: currentEntity } = latestSnapshotRef.current;
      const changedFields = filterChangedFields(nextFields, currentEntity);

      if (_.isEmpty(changedFields)) {
        return;
      }

      const configUpdater = buildConfigUpdater(currentEntity, changedFields);

      if (!defer) {
        setConfig(configUpdater);
        return;
      }

      startTransition(() => {
        setConfig(configUpdater);
      });
    },
    [buildConfigUpdater, setConfig]
  );

  const flushBufferedChanges = useCallback(() => {
    clearScheduledCommits();
    const nextFields = getBufferedFieldChanges();

    if (_.isEmpty(nextFields)) {
      return null;
    }

    return buildConfigUpdater(latestSnapshotRef.current.entity, nextFields);
  }, [buildConfigUpdater, clearScheduledCommits, getBufferedFieldChanges]);

  useEffect(
    () => registerFlusher(entity.id, flushBufferedChanges),
    [entity.id, flushBufferedChanges, registerFlusher]
  );

  useEffect(
    () => () => {
      clearScheduledCommits();
      commitBufferedFields(getBufferedFieldChanges(), { defer: false });
    },
    [clearScheduledCommits, commitBufferedFields, getBufferedFieldChanges]
  );

  const commitBufferedField = useCallback(
    (field, value, { delayMs = 0, ...options } = {}) => {
      clearScheduledCommit(field);

      if (delayMs <= 0) {
        commitBufferedFields({ [field]: value }, options);
        return;
      }

      const timeoutId = setTimeout(() => {
        commitTimeoutsRef.current = removeScheduledCommit(
          commitTimeoutsRef.current,
          field
        );
        commitBufferedFields({ [field]: value }, options);
      }, delayMs);

      commitTimeoutsRef.current = addScheduledCommit(
        commitTimeoutsRef.current,
        field,
        { timeoutId }
      );
    },
    [clearScheduledCommit, commitBufferedFields]
  );

  const updateBufferedField = useCallback((field, value) => {
    setBufferedValues(currentBufferedValues => {
      if (areFieldValuesEqual(currentBufferedValues[field], value)) {
        return currentBufferedValues;
      }

      return {
        ...currentBufferedValues,
        [field]: value,
      };
    });
  }, []);

  const getBufferedFieldBlurHandler = useCallback(
    field => () => {
      commitBufferedField(
        field,
        latestSnapshotRef.current.bufferedValues[field]
      );
    },
    [commitBufferedField]
  );

  return {
    bufferedValues,
    effectiveEntity,
    commitBufferedField,
    getBufferedFieldBlurHandler,
    updateBufferedField,
  };
};

export default useBufferedConfigFields;
