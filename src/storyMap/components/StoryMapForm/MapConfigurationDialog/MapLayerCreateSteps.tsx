/*
 * Copyright © 2025 Technology Matters
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

import { useCallback, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useDispatch, useSelector } from 'terraso-web-client/terrasoApi/store';
import * as yup from 'yup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import Form from 'terraso-web-client/forms/components/Form';
import {
  FormContextProvider,
  useFormTrigger,
} from 'terraso-web-client/forms/formContext';
import ColumnSelect from 'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/ColumnSelect';
import {
  Color,
  Opacity,
  Shape,
  Size,
  useVisualizeForm,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizeStep';
import { UseVisualizeFormArgs } from 'terraso-web-client/sharedData/visualization/components/VisualizeStep';
import {
  identifyLatLngColumns,
  validateCoordinateField,
} from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import { FileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/FileUpload';
import { useMapLayerCreateSession } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import { addMapLayer } from 'terraso-web-client/storyMap/storyMapSlice';
import {
  MapLayerConfig,
  VisualizationConfigForm,
  VisualizeConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';

const VisualizeForm = ({
  visualizeConfig,
  setVisualizeConfig,
}: UseVisualizeFormArgs) => {
  const {
    shape,
    setShape,
    size,
    setSize,
    color,
    setColor,
    opacity,
    setOpacity,
    showPolygonFields,
    showPointsFields,
  } = useVisualizeForm({ visualizeConfig, setVisualizeConfig });

  return (
    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
      {showPointsFields && (
        <>
          <Shape shape={shape} setShape={setShape} />
          <Size size={size} setSize={setSize} />
        </>
      )}
      <Color color={color} setColor={setColor} />
      {showPolygonFields && (
        <Opacity opacity={opacity} setOpacity={setOpacity} />
      )}
    </Grid>
  );
};

type FieldParams<T> = {
  field: {
    value: T;
    onChange: (_: T) => void;
  };
};
type FormField<T> = {
  name: string;
  label: string;
  props?: {
    renderInput: (fieldParams: FieldParams<T>) => React.ReactNode;
  };
};
const useMapLayerFormFields = (isMapFile: boolean) => {
  return useMemo(() => {
    const formFields: FormField<unknown>[] = [
      {
        name: 'mapTitle',
        label: 'storyMap.form_create_map_layer_title_input_label',
      },
    ];
    if (!isMapFile) {
      formFields.push(
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
        }
      );
    }

    formFields.push({
      name: 'visualizeConfig',
      label: 'sharedData.form_step_visualize_step_title',
      props: {
        renderInput: ({ field }) => (
          <VisualizeForm
            visualizeConfig={field.value as VisualizeConfig}
            setVisualizeConfig={field.onChange as (_: VisualizeConfig) => void}
          />
        ),
      },
    });

    const validationSchema = yup
      .object({
        mapTitle: yup.string().trim().required(),
        ...(isMapFile
          ? {}
          : {
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
            }),
      })
      .required();

    return { formFields, validationSchema };
  }, [isMapFile]);
};

type FormState = {
  mapTitle: string;
  latitude: number;
  longitude: number;
  visualizeConfig: VisualizeConfig;
};
const CreateStepsForm = () => {
  const {
    isMapFile,
    visualizationConfig,
    setVisualizationConfig,
    fileContext,
  } = useMapLayerCreateSession()!;

  const { selectedFile, headers } = fileContext ?? {};

  const { latColumn: latitude, lngColumn: longitude } = headers
    ? identifyLatLngColumns(headers as string[])
    : {};

  const { fetching, list: mapLayers } = useSelector(
    state =>
      (state as any).storyMap?.dataLayers ?? { fetching: false, list: [] }
  ) as { fetching: boolean; list: { title: string }[] };

  const initialTitle = (() => {
    const fileName = selectedFile?.name;
    if (fetching || !fileName) {
      return fileName;
    }
    const existingTitles = mapLayers.map(l => l.title);
    let title = fileName;
    for (let index = 2; existingTitles.includes(title); index++) {
      title = fileName + ` (${index})`;
    }
    return title;
  })();

  const initialValues = useRef({
    context: { fileContext },
    mapTitle: initialTitle,
    latitude,
    longitude,
    visualizeConfig: visualizationConfig.visualizeConfig,
  }).current;

  const { formFields, validationSchema } = useMapLayerFormFields(
    Boolean(isMapFile)
  );

  const onChange = useCallback(
    (updatedValues: FormState) => {
      setVisualizationConfig((config: VisualizationConfigForm) => {
        const newConfig = { ...config };
        const { mapTitle, visualizeConfig } = updatedValues;
        if (mapTitle) {
          newConfig.annotateConfig = { ...newConfig.annotateConfig, mapTitle };
        }
        if (visualizeConfig) {
          newConfig.visualizeConfig = visualizeConfig;
        }
        if (!isMapFile) {
          const { latitude, longitude } = updatedValues;
          newConfig.datasetConfig = { latitude, longitude };
        }
        return newConfig;
      });
    },
    [setVisualizationConfig, isMapFile]
  );

  return (
    <Form
      prefix="map-layer"
      localizationPrefix="sharedData.form_step_set_dataset"
      fields={formFields}
      values={initialValues}
      validationSchema={validationSchema}
      onChange={onChange}
    />
  );
};

type MapLayerCreateStepsProps = {
  /** Chapter/title name for the heading. */
  title?: string;
  /** Called with the created layer config after the create mutation. */
  onCreate: (mapLayerConfig: MapLayerConfig) => void;
  /**
   * Cancels the CREATION only: nothing is committed and the host UI (e.g.
   * the map configuration dialog) stays open and unchanged.
   */
  onCancel: () => void;
};

const MapLayerCreateStepsPanel = ({
  title,
  onCreate,
  onCancel,
}: MapLayerCreateStepsProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { owner, entityType } = useCollaborationContext();
  const session = useMapLayerCreateSession()!;
  const {
    visualizationConfig,
    setVisualizationConfig,
    fileContext,
    loadingFile,
    loadingFileError,
    saving,
  } = session;
  const selectedFile = visualizationConfig.selectedFile;

  const [uploading, setUploading] = useState(false);
  const onUploadingChange = useCallback(
    (isUploading: boolean) => setUploading(isUploading),
    []
  );

  const setDataEntry = useCallback(
    (dataEntry?: DataEntryNode) => {
      setVisualizationConfig((config: VisualizationConfigForm) => ({
        ...config,
        selectedFile: dataEntry,
      }));
    },
    [setVisualizationConfig]
  );

  const trigger = useFormTrigger();

  const [createError, setCreateError] = useState(false);
  const onConfirm = useCallback(async () => {
    const isValid = await trigger?.();
    if (!isValid) {
      return;
    }
    setCreateError(false);
    const completeConfig = {
      ...visualizationConfig,
    };
    const filteredConfig = _.omit(
      [
        'datasetConfig.preview',
        'annotateConfig.dataPointsTitle',
        'annotateConfig.mapTitle',
        'annotateConfig.mapDescription',
      ],
      completeConfig
    );
    // Fence: the completion is only applied if THIS session is still alive
    // when the mutation fulfills — a cancelled session never commits.
    const sessionId = session.sessionId;
    dispatch(
      addMapLayer({
        title: _.get('annotateConfig.mapTitle', completeConfig),
        description: _.get('annotateConfig.mapDescription', completeConfig),
        visualizationConfig: filteredConfig,
        selectedFile: visualizationConfig.selectedFile,
        ownerId: owner.id,
        ownerType: entityType,
      })
    ).then(data => {
      if (!session.isCurrentSession(sessionId)) {
        return;
      }
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        onCreate(data.payload);
        return;
      }
      // Stay in the form and offer a retry (no silent dead end).
      setCreateError(true);
    });
  }, [
    dispatch,
    onCreate,
    owner.id,
    entityType,
    visualizationConfig,
    trigger,
    session,
  ]);

  // The form is only shown once the session's file is uploaded AND parsed
  // (`fileContext` holds the parsed headers/geometry every form widget reads);
  // until then a busy indicator (or the upload/load errors) is shown. The
  // parsed guard is load-bearing: the upload resolves one render BEFORE the
  // parse effect flips `loadingFile`, and without it the form renders its
  // column selects against empty headers and the dialog crashes.
  const parsed = Boolean(fileContext);
  const ready =
    Boolean(selectedFile) && parsed && !loadingFile && !loadingFileError;
  const busy =
    uploading ||
    (Boolean(selectedFile) && !loadingFileError && (!parsed || loadingFile));

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Stack spacing={2}>
        <Typography variant="h3" component="h2">
          {title ? (
            <Trans
              i18nKey="storyMap.form_create_map_layer_heading"
              values={{ title: title }}
            >
              prefix
              <i>italic</i>
            </Trans>
          ) : (
            <>{t('storyMap.form_create_map_layer_heading_blank')}</>
          )}
        </Typography>
        <Box>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onCancel}
            disabled={saving}
            sx={{ pl: 0 }}
          >
            {t('storyMap.form_map_layers_create_cancel')}
          </Button>
        </Box>
        <FileUpload
          externalFile={session.file}
          showDropZone={false}
          onCompleteSuccess={setDataEntry}
          onUploadingChange={onUploadingChange}
        />
        {Boolean(loadingFileError) && (
          <Alert severity="error">
            {t('sharedData.upload_rejected_cant-parse', {
              rejectedFiles: selectedFile?.name,
            })}
          </Alert>
        )}
        {busy && (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">
              {t('storyMap.form_map_layers_create_loading')}
            </Typography>
          </Stack>
        )}
        {ready && (
          <>
            <CreateStepsForm />
            {createError && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    disabled={saving}
                    onClick={onConfirm}
                  >
                    {t('storyMap.form_map_layers_create_error_retry')}
                  </Button>
                }
              >
                {t('storyMap.form_map_layers_create_error')}
              </Alert>
            )}
            <Box>
              <Button
                disabled={!trigger || saving}
                size="small"
                onClick={onConfirm}
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : undefined
                }
              >
                {saving
                  ? t('storyMap.form_location_add_data_layer_saving')
                  : t('storyMap.form_map_layers_create_confirm')}
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

/**
 * The map layer creation steps, shown inline (e.g. in the map configuration
 * dialog's right sidebar): upload state, the layer configuration form
 * (title, dataset columns, appearance), validation and the create mutation.
 * Self-contained so the same component can back a persistent (non-dialog)
 * sidebar: the host only provides the create session (see
 * `useMapLayerCreateFlow`) and the create/cancel callbacks. The file comes
 * from the session (never a duplicated prop), and the whole panel is a
 * per-session unit (keyed by the session id) so nothing survives a session.
 */
export const MapLayerCreateSteps = (props: MapLayerCreateStepsProps) => {
  const session = useMapLayerCreateSession();
  if (!session) {
    return null;
  }
  return (
    <FormContextProvider>
      <MapLayerCreateStepsPanel key={session.sessionId} {...props} />
    </FormContextProvider>
  );
};

export default MapLayerCreateSteps;
