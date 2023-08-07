import React, { useCallback } from 'react';
import MembershipsList from 'collaboration/components/MembershipsList';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'terrasoApi/store';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import UserEmailAutocomplete from 'common/components/UserEmailAutocomplete';
import { MEMBERSHIP_ROLE_CONTRIBUTOR } from 'storyMap/storyMapConstants';
import { addMemberships } from 'storyMap/storyMapSlice';

import { useStoryMapConfigContext } from './storyMapConfigContext';

const RoleComponent = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Typography>
      {t(`storyMap.role_${member.userRole.toLowerCase()}`)}
    </Typography>
  );
};

const RemoveButton = props => {
  const { t } = useTranslation();
  const { member, tabIndex, onRemove } = props;

  const onRemoveWrapper = useCallback(() => {
    onRemove(member);
  }, [member, onRemove]);

  return (
    <LoadingButton
      loading={props.loading}
      variant="outlined"
      size="small"
      tabIndex={tabIndex}
      onClick={onRemoveWrapper}
    >
      {t('storyMap.remove_membership')}
    </LoadingButton>
  );
};

const ShareDialog = props => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { open, onClose } = props;
  const { storyMap } = useStoryMapConfigContext();
  const [newContributors, setNewContributors] = React.useState([]);

  const onChange = useCallback(
    value => {
      setNewContributors(value);
    },
    [setNewContributors]
  );

  const onConfirm = useCallback(() => {
    dispatch(
      addMemberships({
        storyMap,
        emails: newContributors,
        userRole: MEMBERSHIP_ROLE_CONTRIBUTOR,
      })
    );
  }, [dispatch, storyMap, newContributors]);

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <Typography variant="h1" component={DialogTitle}>
        {t('storyMap.share_dialog_title', { title: storyMap.title })}
      </Typography>
      <Stack component={DialogContent} spacing={2}>
        <Typography>
          <Trans i18nKey="storyMap.share_dialog_description">
            Prefix
            <ExternalLink href={t('storyMap.share_dialog_help_url')}>
              Link
            </ExternalLink>
          </Trans>
        </Typography>
        <UserEmailAutocomplete
          label={t('storyMap.share_dialog_autocomplete_label')}
          helperText={t('storyMap.share_dialog_autocomplete_helper_text')}
          value={newContributors}
          onChange={onChange}
        />
        <Accordion
          defaultExpanded={!_.isEmpty(storyMap.memberships)}
          elevation={0}
          sx={{
            '&:before': {
              display: 'none',
            },
            '& .MuiAccordionSummary-content': {
              m: 0,
            },
            '& .MuiAccordionSummary-content.Mui-expanded': {
              m: 0,
              // minHeight: 'auto',
            },
            '& .MuiButtonBase-root.MuiAccordionSummary-root.Mui-expanded': {
              minHeight: 'auto',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            sx={{
              p: 0,
              minHeight: 'auto',
              justifyContent: 'flex-start',
              '& .MuiAccordionSummary-content': {
                flexGrow: 0,
              },
            }}
          >
            <Typography variant="h2" sx={{ p: 0 }}>
              {t('storyMap.share_dialog_contributors_title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <MembershipsList
              memberships={storyMap.memberships}
              cardsBreakpoint="xl"
              RemoveComponent={RemoveButton}
              RoleComponent={RoleComponent}
            />
          </AccordionDetails>
        </Accordion>
      </Stack>
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
