import React, { useCallback } from 'react';
import MembershipsList from 'collaboration/components/MembershipsList';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import UserEmailAutocomplete from 'common/components/UserEmailAutocomplete';

import { useStoryMapConfigContext } from './storyMapConfigContext';

const ShareDialog = props => {
  const { t } = useTranslation();
  const { open, onClose, onShare } = props;
  const { storyMap } = useStoryMapConfigContext();
  const [newCollaborators, setNewCollaborators] = React.useState([]);

  console.log({ storyMap });

  const onChange = useCallback(
    value => {
      setNewCollaborators(value);
    },
    [setNewCollaborators]
  );

  const onConfirm = useCallback(() => {
    onShare(newCollaborators);
  }, [newCollaborators, onShare]);

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        {t('storyMap.share_dialog_title', { title: storyMap.title })}
      </DialogTitle>
      <DialogContent>
        <UserEmailAutocomplete value={newCollaborators} onChange={onChange} />
      </DialogContent>
      <DialogContent>
        <MembershipsList
          memberships={storyMap.memberships}
          cardsBreakpoint="xl"
        />
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'flex-end',
          padding: '20px',
        }}
      >
        <Button onClick={onClose}>
          {t('storyMap.share_dialog_cancel_label')}
        </Button>

        <LoadingButton
          variant="contained"
          onClick={onConfirm}
          // loading={loading}
        >
          {t('storyMap.share_dialog_confirm_label')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
