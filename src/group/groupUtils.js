import { extractMembershipsInfo } from 'terraso-client-shared/collaboration/membershipsUtils';

import { extractDataEntries } from 'sharedData/sharedDataUtils';

export const extractGroup = group => ({
  ...group,
  membershipsInfo: extractMembershipsInfo(group.membershipList),
  dataEntries: extractDataEntries(group),
});
