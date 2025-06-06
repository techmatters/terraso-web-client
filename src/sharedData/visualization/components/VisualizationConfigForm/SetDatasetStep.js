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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { normalizeText } from 'terraso-client-shared/utils';
import * as SheetsJs from 'xlsx';
import * as yup from 'yup';
import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import StepperStep from 'common/components/StepperStep';
import Form from 'forms/components/Form';
import { FormContextProvider, useFormGetContext } from 'forms/formContext';
import PageLoader from 'layout/PageLoader';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import { validateCoordinateColumn } from 'sharedData/visualization/visualizationUtils';

import ColumnSelect from './ColumnSelect';

const TABLE_SAMPLE_SIZE = 3;

const validateCoordinateField = coordinate => ({
  name: 'invalidCoordinate',
  message: {
    key: 'invalid_coordinate',
    params: { coordinate },
  },
  test: (value, ctx) => {
    const {
      parent: {
        context: { fileContext },
      },
    } = ctx;
    if (_.isEmpty(value)) {
      return;
    }
    const error = validateCoordinateColumn(fileContext, value);
    if (!error) {
      return true;
    }
    return false;
  },
});

const VALIDATION_SCHEMA = yup
  .object({
    latitude: yup
      .string()
      .trim()
      .required()
      .test(validateCoordinateField('latitude')),
    longitude: yup
      .string()
      .trim()
      .required()
      .test(validateCoordinateField('longitude')),
    dataColumns: yup.object().shape({
      option: yup.string().trim().required(),
      selectedColumns: yup.array().when(['option'], {
        is: option => option === 'custom',
        then: () =>
          yup.array().compact().min(1).of(yup.string().trim().required()),
      }),
    }),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'latitude',
    label: 'sharedData.form_step_set_dataset_latitude_label',
    props: {
      renderInput: fieldParams => (
        <ColumnSelect
          {...fieldParams}
          placeholder="sharedData.form_step_set_dataset_latitude_placeholder"
        />
      ),
    },
  },
  {
    name: 'longitude',
    label: 'sharedData.form_step_set_dataset_longitude_label',
    props: {
      renderInput: fieldParams => (
        <ColumnSelect
          {...fieldParams}
          placeholder="sharedData.form_step_set_dataset_longitude_placeholder"
        />
      ),
    },
  },
  {
    name: 'dataColumns',
    label: 'sharedData.form_step_set_dataset_dataColumns_label',
    props: {
      renderInput: fieldParams => <DataColumns {...fieldParams} />,
    },
  },
  {
    name: 'preview',
    props: {
      renderInput: () => <DatasetPreview />,
    },
  },
];

export const DatasetPreview = () => {
  const { t } = useTranslation();
  const { fileContext } = useVisualizationContext();
  const { sheet, colCount, rowCount, headers } = fileContext;

  const sampleRange = useMemo(
    () =>
      SheetsJs.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: colCount, r: Math.min(rowCount, TABLE_SAMPLE_SIZE) },
      }),
    [colCount, rowCount]
  );

  const sample = useMemo(
    () =>
      SheetsJs.utils.sheet_to_json(sheet, {
        range: sampleRange,
        header: headers,
      }),
    [sheet, sampleRange, headers]
  );

  return (
    <>
      <Typography
        variant="h2"
        sx={{ mb: 1 }}
        id="dataset-previwe-table-description"
      >
        {t('sharedData.form_step_set_dataset_preview_description')}
      </Typography>
      <TableContainer>
        <Table
          aria-labelledby="dataset-previwe-table-description"
          size="small"
          sx={{
            '& .MuiTableRow-head': {
              bgcolor: 'gray.lite1',
            },
            '& .MuiTableCell-root': {
              border: '1px solid rgba(224, 224, 224, 1)',
            },
          }}
        >
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index}>{_.toString(header)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {_.tail(sample).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <TableCell key={header}>{_.toString(row[header])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

const LAT_COLUMN_OPTIONS = ['latitude', 'latitud', 'lat', 'x'];
const LNG_COLUMN_OPTIONS = ['longitude', 'longitud', 'lng', 'lon', 'long', 'y'];

const getScore = (options, header) => {
  const score = _.min(
    options
      .map((option, index) => (header.indexOf(option) + 1) * (index + 1))
      .filter(score => score > 0)
  );
  return score;
};

const getColumnMatch = scores => {
  const winner = _.flow(
    _.filter(value => value.score && value.score !== -1),
    _.sortBy(value => value.score),
    _.first
  )(scores);
  const column = winner ? winner.index : -1;
  return column;
};

const identifyLatLngColumns = headers => {
  const cleanedHeaders = headers.map(normalizeText);
  const latScores = cleanedHeaders.map((header, index) => ({
    score: getScore(LAT_COLUMN_OPTIONS, header),
    index,
  }));
  const latColumnIndex = getColumnMatch(latScores);

  const lngScores = cleanedHeaders.map((header, index) => ({
    score: getScore(LNG_COLUMN_OPTIONS, header),
    index,
  }));
  const lngColumnIndex = getColumnMatch(lngScores);
  return {
    latColumn: latColumnIndex !== -1 ? headers[latColumnIndex] : null,
    lngColumn: lngColumnIndex !== -1 ? headers[lngColumnIndex] : null,
  };
};

const DataColumns = props => {
  const { t } = useTranslation();
  const { field, fieldState } = props;
  const { value, onChange } = field;

  const option = useMemo(() => _.get('option', value), [value]);
  const selectedColumns = useMemo(
    () => value?.selectedColumns || [],
    [value?.selectedColumns]
  );

  const addMore = () => {
    onChange({
      ...value,
      selectedColumns: [...selectedColumns, ''],
    });
  };

  const setColumn = useCallback(
    (indexToSet, event) => {
      const newColumns = selectedColumns.map((column, index) => {
        if (indexToSet !== index) {
          return column;
        }
        return event.target.value;
      });
      onChange({
        ...value,
        option: 'custom',
        selectedColumns: newColumns,
      });
    },
    [onChange, selectedColumns, value]
  );

  const removeColumn = useCallback(
    indexToDelete => {
      const newColumns = selectedColumns.filter(
        (column, index) => indexToDelete !== index
      );
      onChange({
        ...value,
        selectedColumns: newColumns,
      });
    },
    [onChange, selectedColumns, value]
  );

  return (
    <>
      <RadioGroup
        aria-labelledby="dataset-config-dataColumns-label"
        value={option}
        onChange={event => onChange({ ...value, option: event.target.value })}
        className={fieldState?.error ? 'Mui-error' : ''}
      >
        <FormControlLabel
          value="all"
          control={
            <Radio
              slotProps={{
                input: {
                  'aria-label': t(
                    'sharedData.form_step_set_dataset_dataColumns_all'
                  ),
                },
              }}
            />
          }
          label={t('sharedData.form_step_set_dataset_dataColumns_all')}
        />
        <FormControlLabel
          value="custom"
          control={
            <Radio
              slotProps={{
                input: {
                  'aria-label': t(
                    'sharedData.form_step_set_dataset_dataColumns_custom'
                  ),
                },
              }}
            />
          }
          label={t('sharedData.form_step_set_dataset_dataColumns_custom')}
        />
      </RadioGroup>
      <Grid
        container
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ ml: 2.5 }}
      >
        {selectedColumns.map((column, index) => (
          <React.Fragment key={index}>
            <Grid
              size={{ xs: 2 }}
              component={Typography}
              id={`data-column-${index}-label`}
            >
              {t('sharedData.form_step_set_dataset_dataColumns_custom_label', {
                index: index + 1,
              })}
            </Grid>
            <Grid size={{ xs: 7 }}>
              <ColumnSelect
                id={`data-column-${index}`}
                field={{
                  value: column,
                  onChange: newValue => setColumn(index, newValue),
                }}
                placeholder={t(
                  'sharedData.form_step_set_dataset_dataColumns_custom_placeholder'
                )}
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <IconButton
                aria-label={t(
                  'sharedData.form_step_set_dataset_dataColumns_custom_delete',
                  {
                    index: index + 1,
                  }
                )}
                onClick={() => removeColumn(index)}
                sx={{ marginLeft: 3 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
      <Button variant="text" onClick={addMore}>
        {t('sharedData.form_step_set_dataset_dataColumns_add_more')}
      </Button>
    </>
  );
};

const SetDatasetStep = props => {
  const { t } = useTranslation();
  const { onBack, onNext, onReadFileFails } = props;
  const {
    loadingFile,
    loadingFileError,
    visualizationConfig,
    fileContext = {},
  } = useVisualizationContext();
  const { selectedFile, headers } = fileContext;
  const [datasetConfig, setDatasetStepConfig] = useState(
    visualizationConfig.datasetConfig || {}
  );
  const [updatedValues, setUpdatedValues] = useState();
  const { trigger } = useFormGetContext();

  useEffect(() => {
    if (loadingFileError) {
      onReadFileFails();
    }
  }, [loadingFileError, onReadFileFails]);

  useEffect(() => {
    setDatasetStepConfig(visualizationConfig.datasetConfig);
  }, [visualizationConfig.datasetConfig]);

  useEffect(() => {
    if (!headers) {
      return;
    }
    const currentLat = datasetConfig.latitude;
    const currentLng = datasetConfig.longitude;
    const validCurrentLatColumn = _.includes(currentLat, headers);
    const validCurrentLngColumn = _.includes(currentLng, headers);
    if (validCurrentLatColumn && validCurrentLngColumn) {
      return;
    }

    // Guess latitude and longitude columns
    const { latColumn, lngColumn } = identifyLatLngColumns(headers);

    const validLatColumn =
      latColumn && !validateCoordinateColumn(fileContext, latColumn);
    const validLngColumn =
      lngColumn && !validateCoordinateColumn(fileContext, lngColumn);

    setDatasetStepConfig(current => ({
      ...current,
      latitude: validLatColumn ? latColumn : '',
      longitude: validLngColumn ? lngColumn : '',
    }));
  }, [headers, datasetConfig.latitude, datasetConfig.longitude, fileContext]);

  const datasetConfigWithContext = useMemo(
    () => ({
      ...datasetConfig,
      context: {
        fileContext,
      },
    }),
    [datasetConfig, fileContext]
  );

  const cleaneadData = useMemo(() => {
    return VALIDATION_SCHEMA.cast(_.omit('context', updatedValues), {
      assert: false,
    });
  }, [updatedValues]);

  const onNextWrapper = useCallback(async () => {
    const success = await trigger?.();
    if (success) {
      onNext(cleaneadData);
    }
  }, [trigger, cleaneadData, onNext]);

  return (
    <>
      {loadingFile && <PageLoader />}
      <StepperStep
        title={
          selectedFile &&
          t('sharedData.form_step_set_dataset_step_title', {
            selectedFile,
          })
        }
        backLabel={t('sharedData.form_back')}
        onBack={() => onBack(cleaneadData)}
        nextLabel={t('sharedData.form_next')}
        onNext={onNextWrapper}
      >
        {!(loadingFile || loadingFileError) && (
          <>
            <Typography variant="h2">
              {t('sharedData.form_step_set_dataset_step_description')}
            </Typography>
            <Typography sx={{ mb: 2 }}>
              {t('sharedData.form_step_set_dataset_step_lat_lng_descriptionn')}
            </Typography>
            <Form
              aria-labelledby="main-heading"
              prefix="dataset-config"
              localizationPrefix="sharedData.form_step_set_dataset"
              fields={FORM_FIELDS}
              values={datasetConfigWithContext}
              validationSchema={VALIDATION_SCHEMA}
              isMultiStep
              onChange={setUpdatedValues}
            />
          </>
        )}
      </StepperStep>
    </>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <SetDatasetStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
