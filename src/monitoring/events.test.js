/*
 * Copyright © 2024 Technology Matters
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
import { render } from 'tests/utils';

import { useAnalytics } from 'monitoring/analytics';
import { useDownloadEvent, useShareEvent } from 'monitoring/events';

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

test('Events: onShare', async () => {
  const Component = () => {
    const { onShare } = useShareEvent();
    onShare('test');
    return <div></div>;
  };

  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });

  const expectedUrl = window.location.toString();

  await render(<Component />);

  const eventCall = trackEvent.mock.calls[0];
  expect(eventCall[0]).toStrictEqual('share');
  expect(eventCall[1]).toStrictEqual({
    props: {
      method: 'test',
      url: expectedUrl,
    },
  });
});

test('Events: onDownload', async () => {
  const Component = () => {
    const { onDownload } = useDownloadEvent();
    onDownload('group', 'abc', 'test');
    return <div />;
  };

  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });

  await render(<Component />);

  const eventCall = trackEvent.mock.calls[0];
  expect(eventCall[0]).toStrictEqual('dataEntry.file.download');
  expect(eventCall[1]).toStrictEqual({
    props: {
      group: 'abc',
      downloadLocation: 'test',
    },
  });
});
