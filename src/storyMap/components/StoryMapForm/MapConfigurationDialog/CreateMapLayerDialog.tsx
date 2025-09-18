import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { DataEntryNode } from 'terrasoApi/shared/graphqlSchema/graphql';
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
import { addVisualizationConfig } from 'sharedData/sharedDataSlice';
import ColumnSelect from 'sharedData/visualization/components/VisualizationConfigForm/ColumnSelect';
import VisualizationPreview from 'sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview';
// import VisualizationPreview from 'sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview';
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
import { MapLayerConfig } from 'storyMap/storyMapTypes';

import { FileUpload } from './FileUpload';

import theme from 'theme';

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
  })
  .required();

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
    const fields: any[] = [
      {
        name: 'mapTitle',
        label: 'storyMap.form_create_map_layer_title_input_label',
      },
    ];
    if (!isMapFile) {
      fields.push(
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

    fields.push({
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
    return fields;
  }, [isMapFile]);
};

const Preview = ({ getValues }: any) => {
  const { t } = useTranslation();
  return (
    <VisualizationPreview
      useConfigBounds
      title={t('sharedData.form_visualization_preview_title')}
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
  const initialValues = useRef({
    context: { fileContext },
    mapTitle: selectedFile?.name,
    latitude,
    longitude,
    visualizeConfig: visualizationConfig.visualizeConfig,
  }).current;

  const formFields = useMapLayerFormFields(isMapFile);

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
      validationSchema={VALIDATION_SCHEMA}
      onChange={onChange}
      Preview={Preview}
    />
  );
};

type CreateMapLayerDialogProps = {
  onClose: () => void;
  onCreate: (dataLayerConfig: any) => void;
  title?: string;
};
const CreateMapLayerDialog = ({
  onClose,
  onCreate,
  title,
}: CreateMapLayerDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { owner, entityType } = useCollaborationContext();
  const { visualizationConfig, doneLoadingFile, loadingFileError } =
    useVisualizationContext();
  const { selectedFile: dataEntry } = visualizationConfig;

  const onPublish = useCallback(() => {
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
      addVisualizationConfig({
        title: _.get('annotateConfig.mapTitle', completeConfig),
        description: _.get('annotateConfig.mapDescription', completeConfig),
        visualizationConfig: filteredConfig,
        selectedFile: visualizationConfig.selectedFile,
        ownerId: owner.id,
        ownerType: entityType,
      }) as any
    ).then((data: any) => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        onCreate(data.payload);
      }
    });
  }, [dispatch, onCreate, owner.id, entityType, visualizationConfig]);

  const open = Boolean(dataEntry) && doneLoadingFile && !loadingFileError;

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
            {title ? (
              <Trans
                i18nKey="storyMap.form_create_map_layer_dialog_title"
                values={{ title: title }}
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
        <Button size="small" onClick={onPublish} variant="contained">
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
      color: (theme.palette as any).visualization.markerDefaultColor,
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
    >
      <FileUpload onCompleteSuccess={setDataEntry} />
      <CreateMapLayerDialog
        onCreate={onCreate}
        onClose={() => setDataEntry(undefined)}
        title={title}
      />
    </VisualizationContextProvider>
  );
};

export default CreateMapLayerDialog;
