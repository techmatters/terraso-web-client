import { extractMembershipsInfo } from 'terraso-client-shared/collaboration/membershipsUtils';

import { extractDataEntries } from 'sharedData/sharedDataUtils';
import { GroupNode } from 'terraso-client-shared/graphqlSchema/graphql';

export const extractGroup = (group: GroupNode) => ({
  ...group,
  membershipsInfo: extractMembershipsInfo(group.membershipList),
  dataEntries: extractDataEntries(group),
});
