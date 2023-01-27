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

  const onStepUpdate = update =>
    setVisualizationConfig(current => ({
      ...current,
      ...update,
    }));

  const steps = [
    {
      label: t('sharedData.form_step_select_file_label'),
      render: ({ setActiveStepIndex }) => (
        <SelectDataFileStep
          onNext={selectedFile => {
            onStepUpdate({ selectedFile });
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
          onBack={datasetConfig => {
            onStepUpdate({ datasetConfig });
            setActiveStepIndex(current => current - 1);
          }}
          onNext={datasetConfig => {
            onStepUpdate({ datasetConfig });
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
          onBack={visualizeConfig => {
            onStepUpdate({ visualizeConfig });
            setActiveStepIndex(current => current - 1);
          }}
          onNext={visualizeConfig => {
            onStepUpdate({ visualizeConfig });
            setActiveStepIndex(current => current + 1);
          }}
        />
      ),
    },
    {
      label: t('sharedData.form_step_annotate_label'),
      render: ({ setActiveStepIndex }) => (
        <AnnotateStep
          onBack={annotateConfig => {
            onStepUpdate({ annotateConfig });
            setActiveStepIndex(current => current - 1);
          }}
          onNext={annotateConfig => {
            onStepUpdate({ annotateConfig });
            setActiveStepIndex(current => current + 1);
          }}
        />
      ),
    },
    {
      label: t('sharedData.form_step_preview_label'),
      render: ({ setActiveStepIndex }) => (
        <PreviewStep
          onBack={viewportConfig => {
            onStepUpdate({ viewportConfig });
            setActiveStepIndex(current => current - 1);
          }}
          onSaved={onCompleteSuccess}
        />
      ),
    },
  ];

  return (
    <VisualizationContextProvider
      visualizationConfig={visualizationConfig}
      setVisualizationConfig={setVisualizationConfig}
    >
      <Stepper steps={steps} />
    </VisualizationContextProvider>
  );
};

export default VisualizationConfigForm;
