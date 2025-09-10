import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Stack,
} from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import { addVisualizationConfig } from 'sharedData/sharedDataSlice';
import ColumnSelect from 'sharedData/visualization/components/VisualizationConfigForm/ColumnSelect';
// import VisualizationPreview from 'sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview';
import { VisualizeForm } from 'sharedData/visualization/components/VisualizationConfigForm/VisualizeStep';
import {
  useVisualizationContext,
  VisualizationContextProvider,
} from 'sharedData/visualization/visualizationContext';
import { validateCoordinateColumn } from 'sharedData/visualization/visualizationUtils';

import theme from 'theme';

const validateCoordinateField = (coordinate: any) => ({
  name: 'invalidCoordinate',
  message: {
    key: 'invalid_coordinate',
    params: { coordinate },
  },
  test: (value: any, ctx: any) => {
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
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'mapTitle',
    label: 'sharedData.form_step_annotate_map_title_label',
  },
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
  },
  {
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
  },
];

const CreateMapLayerForm = () => {
  const {
    isMapFile,
    setVisualizationConfig,
    fileContext,
    loadingFile,
    loadingFileError,
  } = useVisualizationContext();
  const initialValues = useMemo(
    () => ({ context: fileContext }),
    [fileContext]
  );
  const [updatedValues, setUpdatedValues] = useState();
  // const { trigger } = useFormGetContext();

  useEffect(() => {
    if (!updatedValues) {
      return;
    }
    setVisualizationConfig((config: any) => {
      const newConfig = { ...config };
      const { mapTitle, visualizeConfig } = updatedValues as any;
      if (mapTitle) {
        newConfig.annotateConfig = { ...newConfig.annotateConfig, mapTitle };
      }
      if (visualizeConfig) {
        newConfig.visualizeConfig = visualizeConfig;
      }
      if (isMapFile) {
        const { latitude, longitude } = updatedValues as any;
        newConfig.datasetConfig = { latitude, longitude };
      }
      return newConfig;
    });
  }, [setVisualizationConfig, updatedValues, isMapFile]);

  if (loadingFile) {
    return null;
  }

  if (loadingFileError) {
    console.log(loadingFileError);
    return loadingFileError;
  }

  return (
    <Stack direction="column">
      <Form
        aria-labelledby="main-heading"
        prefix="map-layer"
        localizationPrefix="sharedData.form_step_set_dataset"
        fields={FORM_FIELDS}
        values={initialValues}
        validationSchema={VALIDATION_SCHEMA}
        onChange={setUpdatedValues}
      />
    </Stack>
  );
};

type CreateMapLayerDialogProps = {
  dataEntry?: DataEntryNode;
  open: boolean;
  onClose: () => void;
  onCreate: (dataLayerConfig: any) => void;
  title?: string;
};
const CreateMapLayerDialog = ({
  dataEntry,
  open,
  onClose,
  onCreate,
  title,
}: CreateMapLayerDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { owner, entityType } = useCollaborationContext();

  const [visualizationConfig, setVisualizationConfig] = useState({
    selectedFile: dataEntry,
    visualizeConfig: {
      shape: 'circle',
      size: 15,
      color: (theme.palette as any).visualization.markerDefaultColor,
      opacity: 50,
    },
  });

  useEffect(() => {
    setVisualizationConfig(config => ({ ...config, selectedFile: dataEntry }));
  }, [dataEntry]);

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

      <DialogContent>
        <VisualizationContextProvider
          visualizationConfig={visualizationConfig}
          setVisualizationConfig={setVisualizationConfig}
        >
          {/* <Stack direction="row"> */}
          <FormContextProvider>
            <CreateMapLayerForm />
          </FormContextProvider>
          {/* <VisualizationPreview useConfigBounds /> */}
          {/* </Stack> */}
        </VisualizationContextProvider>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onPublish} variant="contained">
          {t('storyMap.location_dialog_confirm_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateMapLayerDialog;
