import React from 'react';
/* eslint-disable no-restricted-imports */
import {
  TabContext as MUITabContext,
  TabContextProps as MUITabContextProps,
  TabPanel as MUITabPanel,
  TabPanelProps as MUITabPanelProps,
} from '@mui/lab';
import { Tab as MUITab, TabProps as MUITabProps } from '@mui/material';

export { TabList } from '@mui/lab';
export type { TabListProps } from '@mui/lab';
/* eslint-enable no-restricted-imports */

export type TabProps<T extends string> = Omit<MUITabProps, 'value'> & {
  value: T;
};

export const Tab = MUITab as <T extends string>(
  props: TabProps<NoInfer<T>>
) => React.JSX.Element;

export type TabContextProps<T extends string> = Omit<
  MUITabContextProps,
  'value'
> & {
  value: T;
};

export const TabContext = MUITabContext as <T extends string>(
  props: TabContextProps<NoInfer<T>>
) => React.JSX.Element;

export type TabPanelProps<T extends string> = Omit<
  MUITabPanelProps,
  'value'
> & {
  value: T;
};

export const TabPanel = MUITabPanel as <T extends string>(
  props: TabPanelProps<NoInfer<T>>
) => React.JSX.Element;
