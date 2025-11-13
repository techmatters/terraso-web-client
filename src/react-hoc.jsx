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

import React from 'react';

// Component with custom partial prop values
export const withProps = (Component, customProps) =>
  React.forwardRef((props, ref) => {
    const componentProps = {
      ...customProps,
      ...props,
    };
    return <Component ref={ref} {...componentProps} />;
  });

export const withWrapper = (Component, Wrapper) =>
  React.forwardRef((props, ref) => {
    return (
      <Wrapper {...props}>
        <Component ref={ref} {...props} />
      </Wrapper>
    );
  });
