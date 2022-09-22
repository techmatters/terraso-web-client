import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import Stepper from 'common/components/Stepper';

import { VisualizationContextProvider } from 'sharedData/visualization/visualizationContext';

import AnnotateStep from './AnnotateStep';
import PreviewStep from './PreviewStep';
import SelectDataFileStep from './SelectDataFileStep';
import SetDatasetStep from './SetDatasetStep';
import VisualizeStep from './VisualizeStep';

import theme from 'theme';

const initialConfig = {
  datasetConfig: {
    dataColumns: {
      option: '',
      selectedColumns: Array(3).fill(''),
    },
  },
  visualizeConfig: {
    shape: 'circle',
    size: 15,
    color: theme.palette.visualization.markerDefaultColor,
  },
};

const VisualizationConfigForm = props => {
  const { t } = useTranslation();
  const { onCompleteSuccess, onCancel } = props;
  const [visualizationConfig, setVisualizationConfig] = useState(initialConfig);

  const onReadFileFails = setActiveStepIndex => () => {
    setActiveStepIndex(0);
  };

  const steps = [
    {
      label: t('sharedData.form_step_select_file_label'),
      render: ({ setActiveStepIndex }) => (
        <SelectDataFileStep
          onNext={selectedFile => {
            setVisualizationConfig({
              ...initialConfig,
              selectedFile,
            });
            setActiveStepIndex(current => current + 1);
          }}
          onBack={onCancel}
        />
      ),
    },
    {
      label: t('sharedData.form_step_set_dataset_label'),
      render: ({ setActiveStepIndex }) => (
        <SetDatasetStep
          onBack={() => setActiveStepIndex(current => current - 1)}
          onNext={datasetConfig => {
            setVisualizationConfig(current => ({
              ...current,
              datasetConfig,
            }));
            setActiveStepIndex(current => current + 1);
          }}
          onReadFileFails={onReadFileFails(setActiveStepIndex)}
        />
      ),
    },
    {
      label: t('sharedData.form_step_visualize_label'),
      render: ({ setActiveStepIndex }) => (
        <VisualizeStep
          onBack={() => setActiveStepIndex(current => current - 1)}
          onNext={visualizeConfig => {
            setVisualizationConfig(current => ({
              ...current,
              visualizeConfig,
            }));
            setActiveStepIndex(current => current + 1);
          }}
        />
      ),
    },
    {
      label: t('sharedData.form_step_annotate_label'),
      render: ({ setActiveStepIndex }) => (
        <AnnotateStep
          onBack={() => setActiveStepIndex(current => current - 1)}
          onNext={annotateConfig => {
            setVisualizationConfig(current => ({
              ...current,
              annotateConfig,
            }));
            setActiveStepIndex(current => current + 1);
          }}
        />
      ),
    },
    {
      label: t('sharedData.form_step_preview_label'),
      render: ({ setActiveStepIndex }) => (
        <PreviewStep
          onBack={() => setActiveStepIndex(current => current - 1)}
          onSaved={onCompleteSuccess}
        />
      ),
    },
  ];

  return (
    <VisualizationContextProvider visualizationConfig={visualizationConfig}>
      <Stepper steps={steps} />
    </VisualizationContextProvider>
  );
};

export default VisualizationConfigForm;
