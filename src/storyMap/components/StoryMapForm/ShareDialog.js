/*
 * Copyright © 2023 Technology Matters
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp.js';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'terrasoApi/store.ts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore.js';
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

import { MEMBERSHIP_STATUS_PENDING } from 'collaboration/collaborationConstants.js';
import MembershipsList from 'collaboration/components/MembershipsList.js';
import ConfirmButton from 'common/components/ConfirmButton.js';
import ExternalLink from 'common/components/ExternalLink.js';
import UserEmailAutocomplete from 'common/components/UserEmailAutocomplete.js';
import { useAnalytics } from 'monitoring/analytics.js';
import Restricted from 'permissions/components/Restricted.js';
import {
  MEMBERSHIP_ROLE_EDITOR,
  MEMBERSHIP_ROLE_OWNER,
} from 'storyMap/storyMapConstants.js';
import { addMemberships, deleteMembership } from 'storyMap/storyMapSlice.js';

import { useStoryMapConfigContext } from './storyMapConfigContext.js';

const RoleComponent = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Typography>
      {t(`storyMap.role_${member.userRole.toLowerCase()}`)}
      {member.membershipStatus === MEMBERSHIP_STATUS_PENDING && (
        <Chip
          component="span"
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
  const { trackEvent } = useAnalytics();
  const { data: currentUser } = useSelector(state => state.account.currentUser);
  const processing = useSelector(
    state =>
      state.storyMap.memberships.delete[props.member.membershipId]?.processing
  );
  const { t } = useTranslation();
  const { storyMap } = useStoryMapConfigContext();
  const { member, tabIndex } = props;
  const isOwnMembership = useMemo(
    () => member?.userId === currentUser?.id,
    [member, currentUser]
  );

  const onRemoveWrapper = useCallback(() => {
    dispatch(
      deleteMembership({
        storyMap,
        membership: member,
        isOwnMembership,
      })
    ).then(data => {
      const success = data?.meta?.requestStatus === 'fulfilled';
      if (success) {
        if (isOwnMembership) {
          navigate(-1);
        }
        trackEvent('storymap.share.remove');
      }
    });
  }, [dispatch, navigate, trackEvent, member, storyMap, isOwnMembership]);

  const resource = useMemo(() => {
    if (!member?.userRole || member?.userRole === MEMBERSHIP_ROLE_OWNER) {
      return null;
    }
    return {
      storyMap,
      membership: member,
    };
  }, [storyMap, member]);

  const confirmationContent = useMemo(() => {
    return {
      confirmTitle: t(
        isOwnMembership
          ? 'storyMap.leave_membership_confirm_title'
          : 'storyMap.delete_membership_confirm_title',
        {
          name: member.pendingEmail
            ? member.pendingEmail
            : t('user.full_name', { user: member }),
          context: member.membershipStatus?.toLowerCase(),
        }
      ),
      confirmMessage: t(
        isOwnMembership
          ? 'storyMap.leave_membership_confirm_message'
          : 'storyMap.delete_membership_confirm_message',
        {
          name: member.pendingEmail
            ? member.pendingEmail
            : t('user.full_name', { user: member }),
          storyMapTitle: storyMap.title,
          context: member.membershipStatus?.toLowerCase(),
        }
      ),
      confirmButton: t('storyMap.delete_membership_confirm_button'),
      buttonLabel: t('storyMap.delete_membership'),
      ariaLabel: t('storyMap.delete_membership'),
    };
  }, [t, member, storyMap, isOwnMembership]);

  return (
    <Restricted permission="storyMap.deleteMembership" resource={resource}>
      <ConfirmButton
        onConfirm={onRemoveWrapper}
        loading={processing}
        buttonProps={{
          tabIndex,
        }}
        {...confirmationContent}
      />
    </Restricted>
  );
};

const ShareDialog = props => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const processing = useSelector(
    state => state.storyMap.memberships.add.saving
  );
  const { open, onClose } = props;
  const { storyMap } = useStoryMapConfigContext();
  const [newEditors, setNewEditors] = useState([]);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    setExpanded(!_.isEmpty(storyMap.memberships));
  }, [storyMap.memberships]);

  const onChange = useCallback(
    value => {
      setNewEditors(value);
    },
    [setNewEditors]
  );

  const onConfirm = useCallback(() => {
    dispatch(
      addMemberships({
        storyMap,
        emails: newEditors,
        userRole: MEMBERSHIP_ROLE_EDITOR,
      })
    ).then(data => {
      const success = data?.meta?.requestStatus === 'fulfilled';
      if (success) {
        setNewEditors([]);
        trackEvent('storymap.share.invite', {
          props: {
            count: newEditors.length,
          },
        });
        onClose();
      }
    });
  }, [dispatch, trackEvent, onClose, storyMap, newEditors]);

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
      <Typography
        variant="h1"
        component={DialogTitle}
        sx={{ textTransform: 'uppercase' }}
      >
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
          value={newEditors}
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
            <Typography variant="h2" sx={{ p: 0, textTransform: 'none' }}>
              {t('storyMap.share_dialog_editors_title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <MembershipsList
              showCards
              label={t('storyMap.share_dialog_editors_title')}
              memberships={memberships}
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
          disabled={_.isEmpty(newEditors)}
        >
          {t('storyMap.share_dialog_confirm_label')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
