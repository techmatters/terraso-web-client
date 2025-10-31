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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terrasoApi/shared/graphqlSchema/graphql';
import { useDispatch, useSelector } from 'terrasoApi/store';
import * as yup from 'yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import Form from 'forms/components/Form';
import { FormContextProvider, useFormGetContext } from 'forms/formContext';
import ColumnSelect from 'sharedData/visualization/components/VisualizationConfigForm/ColumnSelect';
import VisualizationPreview from 'sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview';
import {
  Color,
  Opacity,
  Shape,
  Size,
  useVisualizeForm,
} from 'sharedData/visualization/components/VisualizationConfigForm/VisualizeStep';
import {
  useVisualizationContext,
  VisualizationContextProvider,
} from 'sharedData/visualization/visualizationContext';
import {
  identifyLatLngColumns,
  validateCoordinateField,
} from 'sharedData/visualization/visualizationUtils';
import { addMapLayer } from 'storyMap/storyMapSlice';
import { MapLayerConfig } from 'storyMap/storyMapTypes';

import { FileUpload } from './FileUpload';

import theme from 'theme';

const VisualizeForm = ({ visualizeConfig, setVisualizeConfig }: any) => {
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
    <Grid container alignItems="center" spacing={2}>
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

const useMapLayerFormFields = (isMapFile: boolean) => {
  return useMemo(() => {
    const formFields: any[] = [
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
            renderInput: (fieldParams: any) => (
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
            renderInput: (fieldParams: any) => (
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
        renderInput: ({ field }: { field: any }) => (
          <VisualizeForm
            visualizeConfig={field.value}
            setVisualizeConfig={field.onChange}
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

const Preview = ({ getValues }: any) => {
  const { t } = useTranslation();
  return (
    <VisualizationPreview
      useConfigBounds
      title={t('sharedData.form_visualization_preview_title')}
      showPopups={false}
      customConfig={{ visualizeConfig: getValues().visualizeConfig }}
    />
  );
};

const CreateMapLayerForm = () => {
  const {
    isMapFile,
    visualizationConfig,
    setVisualizationConfig,
    fileContext,
  } = useVisualizationContext();

  const { selectedFile, headers } = fileContext ?? {};

  const { latColumn: latitude, lngColumn: longitude } = headers
    ? identifyLatLngColumns(headers)
    : {};

  const { fetching, list: mapLayers } = useSelector(
    state => state.storyMap.dataLayers
  ) as { fetching: boolean; list: MapLayerConfig[] };

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

  const { formFields, validationSchema } = useMapLayerFormFields(isMapFile);

  const onChange = useCallback(
    (updatedValues: any) => {
      setVisualizationConfig((config: any) => {
        const newConfig = { ...config };
        const { mapTitle, visualizeConfig } = updatedValues as any;
        if (mapTitle) {
          newConfig.annotateConfig = { ...newConfig.annotateConfig, mapTitle };
        }
        if (visualizeConfig) {
          newConfig.visualizeConfig = visualizeConfig;
        }
        if (!isMapFile) {
          const { latitude, longitude } = updatedValues as any;
          newConfig.datasetConfig = { latitude, longitude };
        }
        return newConfig;
      });
    },
    [setVisualizationConfig, isMapFile]
  );

  return (
    <Form
      aria-labelledby="main-heading"
      prefix="map-layer"
      localizationPrefix="sharedData.form_step_set_dataset"
      fields={formFields}
      values={initialValues}
      validationSchema={validationSchema}
      onChange={onChange}
      Preview={Preview}
    />
  );
};

type CreateMapLayerDialogProps = {
  onClose: () => void;
  onCreate: (dataLayerConfig: any) => void;
  chapterTitle?: string;
};
const CreateMapLayerDialog = ({
  onClose,
  onCreate,
  chapterTitle,
}: CreateMapLayerDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { owner, entityType } = useCollaborationContext();
  const { visualizationConfig, loadingFile, loadingFileError } =
    useVisualizationContext();
  const { selectedFile: dataEntry } = visualizationConfig;

  const formContext = useFormGetContext();
  const trigger = 'trigger' in formContext ? formContext.trigger : undefined;

  const onConfirm = useCallback(async () => {
    const isValid = await trigger?.();
    if (!isValid) {
      return;
    }

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
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        onCreate(data.payload);
      }
    });
  }, [dispatch, onCreate, owner.id, entityType, visualizationConfig, trigger]);

  const open = Boolean(dataEntry) && !loadingFile && !loadingFileError;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      aria-labelledby="map-location-dialog-title"
      aria-describedby="map-location-dialog-content-text"
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack>
          <DialogTitle
            component="h1"
            id="map-location-dialog-title"
            sx={{ pb: 0 }}
          >
            {chapterTitle ? (
              <Trans
                i18nKey="storyMap.form_create_map_layer_dialog_title"
                values={{ title: chapterTitle }}
              >
                prefix
                <i>italic</i>
              </Trans>
            ) : (
              <>{t('storyMap.form_create_map_layer_dialog_title_blank')}</>
            )}
          </DialogTitle>
        </Stack>
        <DialogActions sx={{ pr: 3 }}>
          <Button size="small" onClick={onClose}>
            {t('storyMap.location_dialog_cancel_button')}
          </Button>
        </DialogActions>
      </Stack>

      <DialogContent>{open && <CreateMapLayerForm />}</DialogContent>
      <DialogActions>
        <Button
          disabled={!trigger}
          size="small"
          onClick={onConfirm}
          variant="contained"
        >
          {t('storyMap.form_location_add_data_layer_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CreateMapLayerFileUploadProps {
  onCreate: (mapLayer: MapLayerConfig) => void;
  title?: string;
}
export const CreateMapLayerFileUpload = ({
  onCreate,
  title,
}: CreateMapLayerFileUploadProps) => {
  const [visualizationConfig, setVisualizationConfig] = useState({
    selectedFile: undefined as DataEntryNode | undefined,
    visualizeConfig: {
      shape: 'circle',
      size: 15,
      color: theme.palette.visualization.markerDefaultColor,
      opacity: 50,
    },
    annotateConfig: {
      dataPoints: [],
    },
  });

  const setDataEntry = useCallback(
    (dataEntry?: DataEntryNode) => {
      setVisualizationConfig(config => ({
        ...config,
        selectedFile: dataEntry,
      }));
    },
    [setVisualizationConfig]
  );
  useEffect(() => {}, [setVisualizationConfig]);

  return (
    <VisualizationContextProvider
      visualizationConfig={visualizationConfig}
      setVisualizationConfig={setVisualizationConfig}
      dispatchErrors={false}
    >
      <FormContextProvider>
        <FileUpload onCompleteSuccess={setDataEntry} />
        <CreateMapLayerDialog
          onCreate={onCreate}
          onClose={() => setDataEntry(undefined)}
          chapterTitle={title}
        />
      </FormContextProvider>
    </VisualizationContextProvider>
  );
};

export default CreateMapLayerDialog;
