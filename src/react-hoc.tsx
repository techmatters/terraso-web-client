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
export const withProps = <P extends Record<string, any>, T = any>(
  Component: React.ComponentType<P>,
  customProps: Partial<P>
) =>
  React.forwardRef<
    T,
    Omit<P, keyof typeof customProps> &
      Partial<Pick<P, keyof typeof customProps>>
  >((props, ref) => {
    const componentProps = {
      ...customProps,
      ...props,
    } as unknown as P;

    return <Component ref={ref} {...componentProps} />;
  });

// Wrapper HOC
export const withWrapper = <
  P extends Record<string, any>,
  WP extends Record<string, any>,
  T = any,
>(
  Component: React.ComponentType<P>,
  Wrapper: React.ComponentType<WP>
) =>
  React.forwardRef<T, P & WP>((props, ref) => {
    return (
      <Wrapper {...(props as WP)}>
        <Component ref={ref} {...(props as P)} />
      </Wrapper>
    );
  });
