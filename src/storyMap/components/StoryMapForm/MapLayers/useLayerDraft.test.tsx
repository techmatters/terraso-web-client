/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import { useState } from 'react';

import {
  LayerDraftOptions,
  useLayerDraft,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/useLayerDraft';

jest.mock('terraso-client-shared/terrasoApi/api');

type LayerDraft = ReturnType<typeof useLayerDraft>;

const captureDrafts = async (options: Partial<LayerDraftOptions> = {}) => {
  const drafts: LayerDraft[] = [];
  const Harness = () => {
    const [count, setCount] = useState(0);
    // Legacy configs have NO `dataLayers` key at all: pass it through as
    // undefined exactly like the hosts do.
    const draft = useLayerDraft({
      fetchEnabled: false,
      dataLayers: undefined,
      ...options,
    });
    drafts.push(draft);
    return (
      <button type="button" onClick={() => setCount(current => current + 1)}>
        rerender ({count})
      </button>
    );
  };
  await render(<Harness />);
  return drafts;
};

test('useLayerDraft: derived maps are referentially stable across re-renders for a legacy config without dataLayers', async () => {
  const drafts = await captureDrafts();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
  });

  expect(drafts.length).toBeGreaterThanOrEqual(3);
  const [first, ...rest] = drafts;
  rest.forEach(draft => {
    // A fresh `{}` default would churn every memo downstream (the layer-stack
    // publish effect then loops: publish → host render → new `{}` → …).
    expect(draft.layerConfigsById).toBe(first.layerConfigsById);
    expect(draft.resolveLayerConfig).toBe(first.resolveLayerConfig);
    expect(draft.fetchedMapLayers).toBe(first.fetchedMapLayers);
  });
});

test('useLayerDraft: resolveLayerConfig stays consistent for unknown layers on a legacy config', async () => {
  const drafts = await captureDrafts();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
  });

  expect(drafts[0].resolveLayerConfig('missing')).toBeUndefined();
  expect(drafts[1].resolveLayerConfig('missing')).toBeUndefined();
  expect(drafts[1].resolveLayerConfig).toBe(drafts[0].resolveLayerConfig);
});
