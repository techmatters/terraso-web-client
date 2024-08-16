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

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Stepper from 'common/components/Stepper';
import NavigationBlockedDialog from 'navigation/components/NavigationBlockedDialog';
import { useNavigationBlocker } from 'navigation/navigationContext';
import {
  useVisualizationContext,
  VisualizationContextProvider,
} from 'sharedData/visualization/visualizationContext';

import AnnotateStep from './AnnotateStep';
import PreviewStep from './PreviewStep';
import SelectDataFileStep from './SelectDataFileStep';
import SetDatasetStep from './SetDatasetStep';
import VisualizeStep from './VisualizeStep';

import theme from 'theme';

const INITIAL_CONFIG = {
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
    opacity: 50,
  },
};

const Steps = props => {
  const { t } = useTranslation();
  const { isMapFile } = useVisualizationContext();
  const { onCompleteSuccess, onCancel, onReadFileFails, onStepUpdate } = props;

  const selectFileStep = {
    label: t('sharedData.form_step_select_file_label'),
    showStepper: false,
    render: ({ setActiveStepIndex }) => (
      <SelectDataFileStep
        onNext={selectedFile => {
          onStepUpdate({ selectedFile });
          setActiveStepIndex(current => current + 1);
        }}
        onBack={onCancel}
      />
    ),
  };
  const setDataSetStep = {
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
  };
  const visualizeStep = {
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
  };
  const annotateStep = {
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
  };
  const previewStep = {
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
  };

  const steps = isMapFile
    ? [selectFileStep, visualizeStep, annotateStep, previewStep]
    : [
        selectFileStep,
        setDataSetStep,
        visualizeStep,
        annotateStep,
        previewStep,
      ];
  return (
    <Stepper
      steps={steps}
      listProps={{
        'aria-label': t('sharedData.form_stepper_label'),
      }}
    />
  );
};

const VisualizationConfigForm = props => {
  const { t } = useTranslation();
  const { onCompleteSuccess, onCancel } = props;
  const [visualizationConfig, setVisualizationConfig] =
    useState(INITIAL_CONFIG);
  const [isDirty, setIsDirty] = useState(false);

  const { isBlocked, proceed, cancel, disable } = useNavigationBlocker(
    isDirty,
    t('sharedData.visualization_unsaved_changes_message')
  );

  const onReadFileFails = useCallback(
    setActiveStepIndex => () => {
      setActiveStepIndex(0);
    },
    []
  );

  const onStepUpdate = useCallback(update => {
    setVisualizationConfig(current => ({
      ...current,
      ...update,
    }));
    setIsDirty(true);
  }, []);

  const onCompleteSuccessWrapper = useCallback(
    visualizationConfig => {
      setIsDirty(false);
      disable();
      onCompleteSuccess(visualizationConfig);
    },
    [onCompleteSuccess, disable]
  );

  return (
    <>
      {isBlocked && (
        <NavigationBlockedDialog
          title={t('sharedData.visualization_unsaved_changes_title')}
          message={t('sharedData.visualization_unsaved_changes_message')}
          onConfirm={proceed}
          onCancel={cancel}
        />
      )}
      <VisualizationContextProvider
        visualizationConfig={visualizationConfig}
        setVisualizationConfig={setVisualizationConfig}
      >
        <Steps
          onReadFileFails={onReadFileFails}
          onStepUpdate={onStepUpdate}
          onCompleteSuccess={onCompleteSuccessWrapper}
          onCancel={onCancel}
        />
      </VisualizationContextProvider>
    </>
  );
};

export default VisualizationConfigForm;
