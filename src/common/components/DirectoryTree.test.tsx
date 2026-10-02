/*
 * Copyright © 2025 Technology Matters
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

import { fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import DirectoryTree from 'terraso-web-client/common/components/DirectoryTree';

describe('DirectoryTree (generic)', () => {
  const nodes = [
    {
      id: 'root-a',
      label: 'Root A',
      children: [
        { id: 'child-a1', label: 'Child A1' },
        { id: 'child-a2', label: 'Child A2' },
      ],
    },
    { id: 'leaf-b', label: 'Leaf B' },
  ];

  test('renders nodes and their children with tree roles', async () => {
    await render(<DirectoryTree aria-label="Tree" nodes={nodes} />);

    expect(screen.getByRole('tree', { name: 'Tree' })).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Root A' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Child A1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Leaf B' })
    ).toBeInTheDocument();
    // branch rows expose expanded state
    expect(screen.getByRole('treeitem', { name: 'Root A' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('hides children of collapsed branches', async () => {
    await render(
      <DirectoryTree aria-label="Tree" nodes={nodes} defaultExpandedIds={[]} />
    );

    expect(screen.getByRole('treeitem', { name: 'Root A' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(
      screen.queryByRole('treeitem', { name: 'Child A1' })
    ).not.toBeInTheDocument();
  });

  test('calls onNodeClick with the node id', async () => {
    const onNodeClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={nodes}
        onNodeClick={onNodeClick}
      />
    );

    fireEvent.click(screen.getByRole('treeitem', { name: 'Leaf B' }));
    expect(onNodeClick).toHaveBeenCalledWith('leaf-b');
  });

  test('calls onActionClick with the node id without firing onNodeClick', async () => {
    const onNodeClick = jest.fn();
    const onActionClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={[
          {
            id: 'layer-1',
            label: 'Layer 1',
            action: { label: 'Toggle layer', icon: <span>eye</span> },
          },
        ]}
        onNodeClick={onNodeClick}
        onActionClick={onActionClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle layer' }));
    expect(onActionClick).toHaveBeenCalledWith('layer-1');
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  test('reflects the on/off state of a node on its row and action', async () => {
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={[
          {
            id: 'layer-1',
            label: 'Layer 1',
            active: true,
            action: { label: 'Toggle layer', icon: <span>eye</span> },
          },
          {
            id: 'layer-2',
            label: 'Layer 2',
            active: false,
            action: { label: 'Toggle layer 2', icon: <span>eye</span> },
          },
        ]}
      />
    );

    expect(screen.getByRole('treeitem', { name: 'Layer 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('button', { name: 'Toggle layer' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('treeitem', { name: 'Layer 2' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    expect(
      screen.getByRole('button', { name: 'Toggle layer 2' })
    ).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('DirectoryTree (keyboard)', () => {
  const nodes = [
    {
      id: 'root-a',
      label: 'Root A',
      children: [
        { id: 'child-a1', label: 'Child A1' },
        { id: 'child-a2', label: 'Child A2' },
      ],
    },
    { id: 'leaf-b', label: 'Leaf B' },
    { id: 'disabled-c', label: 'Disabled C', disabled: true },
  ];

  const row = (name: string) => screen.getByRole('treeitem', { name });

  test('uses a roving tabindex on the rows', async () => {
    await render(<DirectoryTree aria-label="Tree" nodes={nodes} />);

    expect(row('Root A')).toHaveAttribute('tabindex', '0');
    expect(row('Child A1')).toHaveAttribute('tabindex', '-1');
    expect(row('Leaf B')).toHaveAttribute('tabindex', '-1');
  });

  test('ArrowDown/ArrowUp move focus across visible rows', async () => {
    await render(<DirectoryTree aria-label="Tree" nodes={nodes} />);

    row('Root A').focus();
    fireEvent.keyDown(row('Root A'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(row('Child A1'));
    expect(row('Child A1')).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(row('Child A1'), { key: 'ArrowDown' });
    fireEvent.keyDown(row('Child A2'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(row('Leaf B'));

    fireEvent.keyDown(row('Leaf B'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(row('Child A2'));
  });

  test('ArrowRight expands a collapsed branch and moves into its children', async () => {
    await render(
      <DirectoryTree aria-label="Tree" nodes={nodes} defaultExpandedIds={[]} />
    );

    fireEvent.keyDown(row('Root A'), { key: 'ArrowRight' });
    expect(row('Root A')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(row('Root A'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(row('Child A1'));
  });

  test('ArrowLeft collapses an expanded branch and moves to the parent', async () => {
    await render(<DirectoryTree aria-label="Tree" nodes={nodes} />);

    fireEvent.keyDown(row('Child A1'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(row('Root A'));

    fireEvent.keyDown(row('Root A'), { key: 'ArrowLeft' });
    expect(row('Root A')).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter and Space activate the focused row', async () => {
    const onNodeClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={nodes}
        onNodeClick={onNodeClick}
      />
    );

    fireEvent.keyDown(row('Leaf B'), { key: 'Enter' });
    expect(onNodeClick).toHaveBeenCalledWith('leaf-b');

    fireEvent.keyDown(row('Child A1'), { key: ' ' });
    expect(onNodeClick).toHaveBeenCalledWith('child-a1');

    // Branch activation toggles expansion too.
    fireEvent.keyDown(row('Root A'), { key: 'Enter' });
    expect(row('Root A')).toHaveAttribute('aria-expanded', 'false');
    expect(onNodeClick).toHaveBeenCalledWith('root-a');
  });

  test('Enter on a disabled row is a no-op', async () => {
    const onNodeClick = jest.fn();
    await render(
      <DirectoryTree
        aria-label="Tree"
        nodes={nodes}
        onNodeClick={onNodeClick}
      />
    );

    fireEvent.keyDown(row('Disabled C'), { key: 'Enter' });
    expect(onNodeClick).not.toHaveBeenCalled();
  });
});
