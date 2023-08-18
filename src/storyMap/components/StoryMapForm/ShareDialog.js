import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'terrasoApi/store';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import { MEMBERSHIP_STATUS_PENDING } from 'collaboration/collaborationConstants';
import MembershipsList from 'collaboration/components/MembershipsList';
import ConfirmButton from 'common/components/ConfirmButton';
import ExternalLink from 'common/components/ExternalLink';
import UserEmailAutocomplete from 'common/components/UserEmailAutocomplete';
import Restricted from 'permissions/components/Restricted';
import {
  MEMBERSHIP_ROLE_CONTRIBUTOR,
  MEMBERSHIP_ROLE_OWNER,
} from 'storyMap/storyMapConstants';
import { addMemberships, deleteMembership } from 'storyMap/storyMapSlice';

import { useStoryMapConfigContext } from './storyMapConfigContext';

import theme from 'theme';

const RoleComponent = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Typography>
      {t(`storyMap.role_${member.userRole.toLowerCase()}`)}
      {member.membershipStatus === MEMBERSHIP_STATUS_PENDING && (
        <Chip
          label={t('memberships.membership_pending')}
          variant="outlined"
          size="small"
          sx={{
            ml: 1,
            borderRadius: 1,
            textTransform: 'uppercase',
          }}
        />
      )}
    </Typography>
  );
};

const RemoveButton = props => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: currentUser } = useSelector(state => state.account.currentUser);
  const processing = useSelector(
    state =>
      state.storyMap.memberships.delete[props.member.membershipId]?.processing
  );
  const { t } = useTranslation();
  const { storyMap } = useStoryMapConfigContext();
  const { member, tabIndex } = props;

  const onRemoveWrapper = useCallback(() => {
    const isOwnMembership = member?.id === currentUser?.id;
    dispatch(
      deleteMembership({
        storyMap,
        membership: member,
      })
    ).then(data => {
      const success = data?.meta?.requestStatus === 'fulfilled';
      if (success) {
        if (isOwnMembership) {
          navigate(-1);
        }
      }
    });
  }, [dispatch, navigate, member, storyMap, currentUser]);

  const resource = useMemo(() => {
    if (!member?.userRole || member?.userRole === MEMBERSHIP_ROLE_OWNER) {
      return null;
    }
    return {
      storyMap,
      membership: member,
    };
  }, [storyMap, member]);

  return (
    <Restricted permission="storyMap.deleteMembership" resource={resource}>
      <ConfirmButton
        onConfirm={onRemoveWrapper}
        confirmTitle={t('storyMap.remove_membership_confirm_title', {
          user: member,
        })}
        confirmMessage={t('storyMap.remove_membership_confirm_message', {
          user: member,
          storyMapTitle: storyMap.title,
        })}
        confirmButton={t('storyMap.remove_membership_confirm_button')}
        buttonLabel={t('storyMap.remove_membership')}
        ariaLabel={t('storyMap.remove_membership')}
        loading={processing}
        buttonProps={{
          tabIndex,
        }}
      />
    </Restricted>
  );
};

const ShareDialog = props => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const processing = useSelector(
    state => state.storyMap.memberships.add.saving
  );
  const { open, onClose } = props;
  const { storyMap } = useStoryMapConfigContext();
  const [newCollaborators, setNewCollaborators] = useState([]);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    setExpanded(!_.isEmpty(storyMap.memberships));
  }, [storyMap.memberships]);

  const onChange = useCallback(
    value => {
      setNewCollaborators(value);
    },
    [setNewCollaborators]
  );

  const onConfirm = useCallback(() => {
    dispatch(
      addMemberships({
        storyMap,
        emails: newCollaborators,
        userRole: MEMBERSHIP_ROLE_CONTRIBUTOR,
      })
    );
  }, [dispatch, storyMap, newCollaborators]);

  const memberships = useMemo(
    () => [
      {
        ...storyMap.createdBy,
        userRole: MEMBERSHIP_ROLE_OWNER,
      },
      ...storyMap.memberships,
    ],
    [storyMap.memberships, storyMap.createdBy]
  );

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
          value={newCollaborators}
          onChange={onChange}
        />
        <Accordion
          expanded={expanded}
          onChange={(event, isExpanded) => setExpanded(isExpanded)}
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
              {t('storyMap.share_dialog_collaborators_title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <MembershipsList
              memberships={memberships}
              cardsBreakpoint={theme.breakpoints.up('xs')}
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
          loading={processing}
          disabled={_.isEmpty(newCollaborators)}
        >
          {t('storyMap.share_dialog_confirm_label')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
