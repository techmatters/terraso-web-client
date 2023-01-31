import React from 'react';

import SocialShare from 'common/components/SocialShare';
import Breadcrumbs from 'navigation/Breadcrumbs';

import Container from './Container';

const BreadcrumbsShareContainer = () => {
  return (
    <Container
      id="breadcrumbs-share-container"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        pt: 2,
        pb: 2,
      }}
    >
      <Breadcrumbs />
      <SocialShare name="Test" />
    </Container>
  );
};

export default BreadcrumbsShareContainer;
