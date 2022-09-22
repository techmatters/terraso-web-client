import { useAnalytics } from 'monitoring/analytics';

import { useGroupContext } from 'group/groupContext';

export const useSharedData = () => {
  const { trackEvent } = useAnalytics();
  const { owner } = useGroupContext();

  const downloadFile = file => {
    trackEvent('downloadFile', { props: { owner: owner.slug } });
    window.open(file.url, '_blank');
  };

  return { downloadFile };
};
