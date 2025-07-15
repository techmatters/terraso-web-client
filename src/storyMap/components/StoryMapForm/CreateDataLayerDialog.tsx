import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import VisualizationConfigForm from 'sharedData/visualization/components/VisualizationConfigForm';

import { useStoryMapConfigContext } from './storyMapConfigContext';

type CreateDataLayerDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
};
const CreateDataLayerDialog = ({
  open,
  onClose,
  title,
}: CreateDataLayerDialogProps) => {
  const { t } = useTranslation();
  const { storyMap } = useStoryMapConfigContext();

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
        <CollaborationContextProvider owner={storyMap} entityType="story_map">
          <VisualizationConfigForm
            onCompleteSuccess={onClose}
            onCancel={onClose}
            restrictSourceToOwner={false}
          />
        </CollaborationContextProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDataLayerDialog;
