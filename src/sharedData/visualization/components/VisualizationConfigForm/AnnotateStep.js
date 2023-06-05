/*
 * Copyright © 2021-2023 Technology Matters
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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import {
  Grid,
  InputLabel,
  ListItem,
  ListItemAvatar,
  OutlinedInput,
  Typography,
} from '@mui/material';
import List from 'common/components/List';
import StepperStep from 'common/components/StepperStep';
import Form from 'forms/components/Form';
import { FormContextProvider, useFormGetContext } from 'forms/formContext';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import ColumnSelect from './ColumnSelect';
import VisualizationPreview from './VisualizationPreview';

const VALIDATION_SCHEMA = yup
  .object({
    mapTitle: yup.string().trim().required(),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'mapTitle',
    label: 'sharedData.form_step_annotate_map_title_label',
  },
  {
    name: 'annotationTitle',
    label: 'sharedData.form_step_annotate_annotation_title_label',
    props: {
      renderInput: ({ id, field }) => (
        <ColumnSelect
          showSelected
          id={id}
          field={field}
          placeholder={
            field.value
              ? 'sharedData.form_step_annotate_annotation_title_empty_option'
              : 'sharedData.form_step_annotate_annotation_title_placeholder'
          }
        />
      ),
    },
  },
  {
    name: 'dataPoints',
    props: {
      renderInput: ({ field }) => <DataPoints field={field} />,
    },
  },
];

const DataPoints = props => {
  const { t } = useTranslation();
  const { value, onChange } = props.field;
  const [dragging, setDragging] = useState(false);
  const { watch } = useFormContext();

  const annotationTitle = watch('annotationTitle');

  const prevAnnotationTitle = useRef();

  useEffect(() => {
    if (!value) {
      return;
    }
    const newValue = [
      ...value,
      prevAnnotationTitle.current
        ? { column: prevAnnotationTitle.current }
        : null,
    ].filter(dataPoint => dataPoint && dataPoint.column !== annotationTitle);
    if (!_.isEqual(newValue, value)) {
      onChange(newValue);
    }
  }, [annotationTitle, value, onChange]);

  useEffect(() => {
    prevAnnotationTitle.current = annotationTitle;
  }, [annotationTitle]);

  const dataPoints = useMemo(() => (_.isEmpty(value) ? [] : value), [value]);

  const onDragEnd = useCallback(
    ({ destination, source }) => {
      setDragging(false);
      const destinationIndex = destination.index;
      const sourceIndex = source.index;
      const sourceElement = dataPoints[sourceIndex];

      const withoutItem = [
        ...dataPoints.slice(0, sourceIndex),
        ...dataPoints.slice(sourceIndex + 1),
      ];
      const newDataPoints = [
        ...withoutItem.slice(0, destinationIndex),
        sourceElement,
        ...withoutItem.slice(destinationIndex),
      ];

      onChange(newDataPoints);
    },
    [dataPoints, onChange]
  );

  const onLabelChange = useCallback(
    updateIndex => event => {
      const newDataPoints = dataPoints.map((dataPoint, index) => {
        if (index !== updateIndex) {
          return dataPoint;
        }
        return {
          ...dataPoint,
          label: event.target.value,
        };
      });
      onChange(newDataPoints);
    },
    [dataPoints, onChange]
  );

  if (_.isEmpty(dataPoints)) {
    return <></>;
  }

  return (
    <>
      <InputLabel sx={{ textTransform: 'uppercase' }} htmlFor="droppable-list">
        {t('sharedData.form_step_annotate_data_points_label')}
      </InputLabel>
      <Typography id="data-points-description" sx={{ mb: 2 }}>
        {t('sharedData.form_step_annotate_data_points_description')}
      </Typography>
      <DragDropContext
        onDragEnd={onDragEnd}
        onBeforeCapture={() => setDragging(true)}
      >
        <Droppable droppableId="droppable-list">
          {provided => (
            <List
              aria-labelledby="data-points-description"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {dataPoints.map((dataPoint, index) => (
                <Draggable
                  key={dataPoint.column}
                  draggableId={dataPoint.column}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <ListItemAvatar>
                        <DragHandleIcon />
                      </ListItemAvatar>
                      <OutlinedInput
                        inputProps={{
                          'aria-label': t(
                            'sharedData.form_step_annotate_data_points_input_label',
                            {
                              index: index + 1,
                            }
                          ),
                        }}
                        fullWidth
                        placeholder={dataPoint.column}
                        value={dataPoint.label || ''}
                        onChange={onLabelChange(index)}
                      />
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {dragging && provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

const AnnotateStep = props => {
  const { t } = useTranslation();
  const { onNext, onBack } = props;
  const { visualizationConfig, getDataColumns } = useVisualizationContext();
  const [updatedValues, setUpdatedValues] = useState();
  const { trigger } = useFormGetContext();

  const annotateConfig = useMemo(() => {
    const dataColumns = getDataColumns();

    const currentAnnotateConfig = visualizationConfig.annotateConfig || {
      dataPoints: [],
    };
    const toAdd = _.difference(
      dataColumns,
      currentAnnotateConfig.dataPoints.map(point => point.column)
    ).map(column => ({ column }));

    const filtered = currentAnnotateConfig.dataPoints.filter(dataPoint =>
      _.includes(dataPoint.column, dataColumns)
    );

    return {
      ...currentAnnotateConfig,
      dataPoints: [...filtered, ...toAdd],
    };
  }, [visualizationConfig.annotateConfig, getDataColumns]);

  const onNextWrapper = useCallback(async () => {
    const success = await trigger?.();
    if (success) {
      onNext(updatedValues);
    }
  }, [trigger, updatedValues, onNext]);

  return (
    <StepperStep
      title={t('sharedData.form_step_annotate_step_title')}
      backLabel={t('sharedData.form_back')}
      onBack={() => onBack(updatedValues)}
      nextLabel={t('sharedData.form_next')}
      onNext={onNextWrapper}
    >
      <Grid container>
        <Grid item container direction="column" xs={12} md={6}>
          <Form
            aria-labelledby="main-heading"
            aria-describedby="visualization-annotate-step-description"
            prefix="annotate-config"
            localizationPrefix="sharedData.form_step_annotate_fields"
            fields={FORM_FIELDS}
            values={annotateConfig}
            validationSchema={VALIDATION_SCHEMA}
            isMultiStep
            onChange={setUpdatedValues}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <VisualizationPreview
            showPopup
            customConfig={{
              annotateConfig: updatedValues,
            }}
            sampleSize={1}
          />
        </Grid>
      </Grid>
    </StepperStep>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <AnnotateStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
