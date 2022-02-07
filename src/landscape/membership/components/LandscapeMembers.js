import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';

import { fetchLandscapeForMembers } from 'landscape/landscapeSlice';
import { usePermission } from 'permissions';
import { withProps } from 'react-hoc';
import GroupMembersList from 'group/membership/components/GroupMembersList';
import { GroupContextProvider } from 'group/groupContext';
import PageLoader from 'common/components/PageLoader';
import LandscapeMemberLeave from './LandscapeMemberLeave';
import LandscapeMemberRemove from './LandscapeMemberRemove';
import PageTitle from 'common/components/PageTitle';
import PageContainer from 'common/components/PageContainer';
import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.members_list_leave',
});

const Header = ({ landscape }) => {
  const { t } = useTranslation();
  const [loadingPermissions, allowed] = usePermission(
    'group.manageMembers',
    landscape
  );

  if (loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageTitle
        title={t(
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
      <Header landscape={landscape} />
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
