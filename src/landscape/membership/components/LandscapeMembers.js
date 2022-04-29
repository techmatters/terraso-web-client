import React, { useEffect } from 'react';
import { withProps } from 'react-hoc';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import _ from 'lodash/fp';

import { useDocumentTitle } from 'common/document';
import { GroupContextProvider } from 'group/groupContext';
import GroupMembersList from 'group/membership/components/GroupMembersList';
import { fetchLandscapeForMembers } from 'landscape/landscapeSlice';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { usePermission } from 'permissions';
import theme from 'theme';

import LandscapeMemberLeave from './LandscapeMemberLeave';
import LandscapeMemberRemove from './LandscapeMemberRemove';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  renderLabel: () => 'landscape.members_list_leave',
});

const Header = ({ landscape, fetching }) => {
  const { t } = useTranslation();
  const [loadingPermissions, allowed] = usePermission(
    'group.manageMembers',
    landscape
  );

  useDocumentTitle(
    t('landscape.members_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  if (loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageHeader
        header={t(
          allowed
            ? 'landscape.members_title_manager'
            : 'landscape.members_title_member',
          { name: _.get('name', landscape) }
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
            ? 'landscape.members_description_manager'
            : 'landscape.members_description_member',
          { name: _.get('name', landscape) }
        )}
      </Typography>
    </>
  );
};

const LandscapeMembers = () => {
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { data: landscape, fetching } = useSelector(
    state => state.landscape.membersLandscape
  );

  useEffect(() => {
    dispatch(fetchLandscapeForMembers(slug));
  }, [dispatch, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Header landscape={landscape} fetching={fetching} />
      <GroupContextProvider
        owner={landscape}
        groupSlug={landscape.groupSlug}
        MemberLeaveButton={MemberLeaveButton}
        MemberRemoveButton={LandscapeMemberRemove}
      >
        <GroupMembersList />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default LandscapeMembers;
