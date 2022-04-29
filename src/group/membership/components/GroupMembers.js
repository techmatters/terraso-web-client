import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupForMembers } from 'group/groupSlice';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRemove from 'group/membership/components/GroupMemberRemove';
import GroupMembersList from 'group/membership/components/GroupMembersList';

import { withProps } from 'react-hoc';

import theme from 'theme';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  renderLabel: () => 'group.members_list_leave',
});

const Header = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { slug } = useParams();
  const { data: group, fetching } = useSelector(
    state => state.group.membersGroup
  );

  useDocumentTitle(
    t('group.members_document_title', {
      name: _.get('name', group),
    }),
    fetching
  );

  useEffect(() => {
    dispatch(fetchGroupForMembers(slug));
  }, [dispatch, slug]);

  const [loadingPermissions, allowed] = usePermission(
    'group.manageMembers',
    group
  );

  if (fetching || loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageHeader
        header={t(
          allowed
            ? 'group.members_title_manager'
            : 'group.members_title_member',
          { name: _.get('name', group) }
        )}
      />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      >
        {t(
          allowed
            ? 'group.members_description_manager'
            : 'group.members_description_member',
          { name: _.get('name', group) }
        )}
      </Typography>
    </>
  );
};

const GroupMembers = () => {
  const { slug } = useParams();
  const { data: group } = useSelector(state => state.group.membersGroup);

  return (
    <PageContainer>
      <Header />
      <GroupContextProvider
        owner={group}
        groupSlug={slug}
        MemberLeaveButton={MemberLeaveButton}
        MemberRemoveButton={GroupMemberRemove}
      >
        <GroupMembersList />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default GroupMembers;
