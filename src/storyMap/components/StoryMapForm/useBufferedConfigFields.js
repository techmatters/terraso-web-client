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

const hasBufferedFieldChanges = (bufferedValues, entity, fields) =>
  fields.some(
    field => !areFieldValuesEqual(bufferedValues[field], entity[field])
  );

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
  const bufferedValuesRef = useRef(bufferedValues);
  const entityRef = useRef(entity);
  const previousEntityRef = useRef(entity);
  const commitTimeoutsRef = useRef({});
  const dirtyFieldsRef = useRef(new Set());

  const effectiveEntity = useMemo(
    () => ({
      ...entity,
      ...bufferedValues,
    }),
    [bufferedValues, entity]
  );

  useEffect(() => {
    bufferedValuesRef.current = bufferedValues;
  }, [bufferedValues]);

  useEffect(() => {
    entityRef.current = entity;

    setBufferedValues(currentBufferedValues => {
      if (entity.id !== previousEntityRef.current.id) {
        return getBufferedValues(entity, fields);
      }

      const { changed, nextBufferedValues } = fields.reduce(
        (accumulator, field) => {
          if (dirtyFieldsRef.current.has(field)) {
            if (
              areFieldValuesEqual(entity[field], currentBufferedValues[field])
            ) {
              dirtyFieldsRef.current.delete(field);
            }
            return accumulator;
          }

          if (
            !areFieldValuesEqual(
              entity[field],
              previousEntityRef.current[field]
            ) &&
            areFieldValuesEqual(
              currentBufferedValues[field],
              previousEntityRef.current[field]
            )
          ) {
            return {
              changed: true,
              nextBufferedValues: {
                ...accumulator.nextBufferedValues,
                [field]: entity[field],
              },
            };
          }

          return accumulator;
        },
        {
          changed: false,
          nextBufferedValues: currentBufferedValues,
        }
      );

      return changed ? nextBufferedValues : currentBufferedValues;
    });

    previousEntityRef.current = entity;
  }, [entity, fields]);

  useEffect(() => {
    setBufferedChapterChangesPending(
      entity.id,
      hasBufferedFieldChanges(bufferedValues, entity, fields)
    );
  }, [bufferedValues, entity, fields, setBufferedChapterChangesPending]);

  useEffect(
    () => () => {
      setBufferedChapterChangesPending(entity.id, false);
    },
    [entity.id, setBufferedChapterChangesPending]
  );

  const clearScheduledCommit = useCallback(field => {
    const pendingFieldCommit = commitTimeoutsRef.current[field];
    if (!pendingFieldCommit) {
      return;
    }

    clearTimeout(pendingFieldCommit.timeoutId);
    delete commitTimeoutsRef.current[field];
  }, []);

  const clearScheduledCommits = useCallback(() => {
    Object.values(commitTimeoutsRef.current).forEach(pendingFieldCommit => {
      clearTimeout(pendingFieldCommit.timeoutId);
    });

    commitTimeoutsRef.current = {};
  }, []);

  const getBufferedFieldChanges = useCallback(() => {
    const currentBufferedValues = bufferedValuesRef.current;
    const currentEntity = entityRef.current;

    return fields.reduce((nextFields, field) => {
      if (
        areFieldValuesEqual(currentBufferedValues[field], currentEntity[field])
      ) {
        return nextFields;
      }

      return {
        ...nextFields,
        [field]: currentBufferedValues[field],
      };
    }, {});
  }, [fields]);

  const commitBufferedFields = useCallback(
    (nextFields, { defer = true } = {}) => {
      const currentEntity = entityRef.current;
      const changedFields = Object.entries(nextFields).reduce(
        (accumulator, [field, value]) => {
          if (areFieldValuesEqual(currentEntity[field], value)) {
            return accumulator;
          }

          return {
            ...accumulator,
            [field]: value,
          };
        },
        {}
      );

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
    dirtyFieldsRef.current.clear();

    const currentEntity = entityRef.current;
    const nextFields = getBufferedFieldChanges();

    if (_.isEmpty(nextFields)) {
      return null;
    }

    return buildConfigUpdater(currentEntity, nextFields);
  }, [buildConfigUpdater, clearScheduledCommits, getBufferedFieldChanges]);

  useEffect(
    () => registerFlusher(entity.id, flushBufferedChanges),
    [entity.id, flushBufferedChanges, registerFlusher]
  );

  useEffect(
    () => () => {
      const pendingBufferedChanges = flushBufferedChanges();
      if (!pendingBufferedChanges) {
        return;
      }

      commitBufferedFields(getBufferedFieldChanges(), { defer: false });
    },
    [commitBufferedFields, flushBufferedChanges, getBufferedFieldChanges]
  );

  const commitBufferedField = useCallback(
    (field, value, options) => {
      clearScheduledCommit(field);
      commitBufferedFields({ [field]: value }, options);
    },
    [clearScheduledCommit, commitBufferedFields]
  );

  const scheduleBufferedFieldCommit = useCallback(
    (field, value, delay) => {
      clearScheduledCommit(field);

      const timeoutId = setTimeout(() => {
        delete commitTimeoutsRef.current[field];
        commitBufferedField(field, value);
      }, delay);

      commitTimeoutsRef.current[field] = {
        timeoutId,
        value,
      };
    },
    [clearScheduledCommit, commitBufferedField]
  );

  const updateBufferedField = useCallback((field, value) => {
    setBufferedValues(currentBufferedValues => {
      if (areFieldValuesEqual(currentBufferedValues[field], value)) {
        if (areFieldValuesEqual(value, entityRef.current[field])) {
          dirtyFieldsRef.current.delete(field);
        }
        return currentBufferedValues;
      }

      if (areFieldValuesEqual(value, entityRef.current[field])) {
        dirtyFieldsRef.current.delete(field);
      } else {
        dirtyFieldsRef.current.add(field);
      }

      return {
        ...currentBufferedValues,
        [field]: value,
      };
    });
  }, []);

  const getBufferedFieldBlurHandler = useCallback(
    field => () => {
      commitBufferedField(field, bufferedValuesRef.current[field]);
    },
    [commitBufferedField]
  );

  return {
    bufferedValues,
    effectiveEntity,
    commitBufferedField,
    getBufferedFieldBlurHandler,
    scheduleBufferedFieldCommit,
    updateBufferedField,
  };
};

export default useBufferedConfigFields;
