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
import SharedDataUpload from 'sharedData/components/SharedDataUpload';

import { useStoryMapConfigContext } from './storyMapConfigContext';

type UploadFileDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  targetSlug: string;
  targetType: string;
};
const UploadFileDialog = ({
  open,
  onClose,
  title,
  targetType,
  targetSlug,
}: UploadFileDialogProps) => {
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
                i18nKey="storyMap.form_upload_file_dialog_title"
                values={{ title: title }}
              >
                prefix
                <i>italic</i>
              </Trans>
            ) : (
              <>{t('storyMap.form_upload_file_dialog_title_blank')}</>
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
          <SharedDataUpload
            onCompleteSuccess={onClose}
            onCancel={onClose}
            targetInput={{
              targetType,
              targetSlug,
            }}
          />
        </CollaborationContextProvider>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFileDialog;
