import React from 'react';

import { render } from 'tests/utils';
import { useAnalytics, plausible } from 'monitoring/analytics';

jest.mock('plausible-tracker', () => () => ({
  trackEvent: jest.fn(),
  enableAutoPageviews: jest.fn(),
  enableAutoOutboundTracking: jest.fn(),
}));

const Component = () => {
  const { trackEvent } = useAnalytics();

  trackEvent('eventTest', { props: { customProp: 'testProp' } });
  return (<div></div>);
}

test('Analytics: add language to custom events', async () => {
  await render(<Component />);

  const eventCall = plausible.trackEvent.mock.calls[0];
  expect(eventCall[1]).toStrictEqual({
    props: {
      customProp: 'testProp',
      language: 'en-US',
    },
  });
});
