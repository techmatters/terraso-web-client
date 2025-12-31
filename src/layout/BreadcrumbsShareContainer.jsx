/*
 * Copyright © 2021-2023 Technology Matters
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

import SocialShare from 'terraso-web-client/common/components/SocialShare';
import Container from 'terraso-web-client/layout/Container';
import Breadcrumbs from 'terraso-web-client/navigation/components/Breadcrumbs';
import { usePathParams } from 'terraso-web-client/navigation/components/Routes';

const BreadcrumbsShareContainer = () => {
  const { breadcrumbsShareProps, showBreadcrumbs } = usePathParams();

  if (!showBreadcrumbs) {
    return null;
  }

  const topMargin = breadcrumbsShareProps?.marginTop ?? '20px';

  return (
    <Container
      id="breadcrumbs-share-container"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: topMargin,
        backgroundColor: theme =>
          breadcrumbsShareProps?.bgColor || theme.palette.primary.background,
      }}
    >
      <Breadcrumbs />
      <SocialShare
        buttonProps={{
          sx: {
            mt: 2,
            mb: 2,
          },
        }}
      />
    </Container>
  );
};

export default BreadcrumbsShareContainer;
