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

import { useCallback, useMemo, useRef, useState } from 'react';
import type React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, IconButton, Typography } from '@mui/material';

export type DirectoryTreeNodeAction = {
  /** Accessible name of the action button. */
  label: string;
  icon: React.ReactNode;
};

export type DirectoryTreeNode = {
  id: string;
  label: React.ReactNode;
  /** Explicit accessible name for the row (defaults to string labels). */
  'aria-label'?: string;
  children?: DirectoryTreeNode[];
  /**
   * Generic on/off state for the row, exposed via `aria-selected` on the row
   * and `aria-pressed` on the row's action button (if any).
   */
  active?: boolean;
  /** Optional clickable adornment rendered at the end of the row. */
  action?: DirectoryTreeNodeAction;
  /** Renders the row as non-interactive (e.g. an empty-state placeholder). */
  disabled?: boolean;
};

export type DirectoryTreeProps = {
  nodes: DirectoryTreeNode[];
  /** Ids of expanded branch nodes; defaults to all branch nodes. */
  defaultExpandedIds?: string[];
  /** Called when a row is clicked (branch rows toggle expansion as well). */
  onNodeClick?: (nodeId: string) => void;
  /** Called when a row's action adornment is clicked. */
  onActionClick?: (nodeId: string) => void;
  'aria-label'?: string;
};

/** A row of the visible (expanded) tree, in DOM order. */
type VisibleRow = {
  node: DirectoryTreeNode;
  level: number;
  parentId?: string;
  hasChildren: boolean;
  isExpanded: boolean;
};

const flattenVisibleRows = (
  nodes: DirectoryTreeNode[],
  collapsedIds: Set<string>,
  level = 1,
  parentId?: string,
  out: VisibleRow[] = []
): VisibleRow[] => {
  nodes.forEach(node => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = hasChildren && !collapsedIds.has(node.id);
    out.push({ node, level, parentId, hasChildren, isExpanded });
    if (isExpanded) {
      flattenVisibleRows(
        node.children ?? [],
        collapsedIds,
        level + 1,
        node.id,
        out
      );
    }
  });
  return out;
};

type DirectoryTreeRowProps = {
  row: VisibleRow;
  collapsedIds: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  onActionClick?: (nodeId: string) => void;
  /** Roving tabindex: only the focused row is tabbable. */
  focusedId?: string;
  rowRef: (nodeId: string, element: HTMLElement | null) => void;
  onRowKeyDown: (nodeId: string, event: React.KeyboardEvent) => void;
};

const DirectoryTreeRow = ({
  row,
  collapsedIds,
  onToggleExpanded,
  onNodeClick,
  onActionClick,
  focusedId,
  rowRef,
  onRowKeyDown,
}: DirectoryTreeRowProps) => {
  const { node, level, hasChildren, isExpanded } = row;
  const isFocused = node.id === focusedId;

  const activate = useCallback(() => {
    if (node.disabled) {
      return;
    }
    if (hasChildren) {
      onToggleExpanded(node.id);
    }
    onNodeClick?.(node.id);
  }, [node.disabled, node.id, hasChildren, onToggleExpanded, onNodeClick]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (node.disabled) {
        // Disabled rows (empty-state placeholders) are inert: swallow the
        // click so it cannot bubble to the enclosing branch row.
        event.stopPropagation();
        return;
      }
      activate();
      event.stopPropagation();
    },
    [node.disabled, activate]
  );

  const handleActionClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onActionClick?.(node.id);
    },
    [node.id, onActionClick]
  );

  return (
    <Box
      ref={(element: HTMLElement | null) => rowRef(node.id, element)}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={node.active ?? false}
      aria-disabled={node.disabled || undefined}
      aria-level={level}
      aria-label={
        node['aria-label'] ??
        (typeof node.label === 'string' ? node.label : undefined)
      }
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      onKeyDown={event => onRowKeyDown(node.id, event)}
      sx={{ cursor: node.disabled ? 'default' : 'pointer' }}
    >
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(0.5),
          opacity: node.disabled ? 0.6 : 1,
        })}
      >
        <Box sx={{ width: 24, height: 24, display: 'flex' }}>
          {hasChildren &&
            (isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />)}
        </Box>
        <Typography component="span" variant="body2" sx={{ flexGrow: 1 }}>
          {node.label}
        </Typography>
        {node.action && (
          <IconButton
            size="small"
            aria-label={node.action.label}
            aria-pressed={node.active ?? false}
            onClick={handleActionClick}
          >
            {node.action.icon}
          </IconButton>
        )}
      </Box>
      {hasChildren && isExpanded && (
        <Box role="group">
          {node.children?.map(child => (
            <DirectoryTreeRow
              key={child.id}
              row={{
                node: child,
                level: level + 1,
                parentId: node.id,
                hasChildren: (child.children?.length ?? 0) > 0,
                isExpanded:
                  (child.children?.length ?? 0) > 0 &&
                  !collapsedIds.has(child.id),
              }}
              collapsedIds={collapsedIds}
              onToggleExpanded={onToggleExpanded}
              onNodeClick={onNodeClick}
              onActionClick={onActionClick}
              focusedId={focusedId}
              rowRef={rowRef}
              onRowKeyDown={onRowKeyDown}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * Generic, data-driven directory tree (tree of expandable branches with
 * optional per-row action adornments). Thin, typed, themable wrapper in the
 * same spirit as `Tabs.tsx`. Implements minimal WAI-ARIA tree keyboard
 * support: roving tabindex with Up/Down arrows to move focus, Right/Left to
 * expand/collapse branches, Enter/Space to activate a row.
 */
const DirectoryTree = ({
  nodes,
  defaultExpandedIds,
  onNodeClick,
  onActionClick,
  'aria-label': ariaLabel,
}: DirectoryTreeProps) => {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    if (defaultExpandedIds === undefined) {
      return new Set();
    }
    const expanded = new Set(defaultExpandedIds);
    const notExpanded: string[] = [];
    const collect = (items: DirectoryTreeNode[]) => {
      items.forEach(item => {
        if ((item.children?.length ?? 0) > 0) {
          if (!expanded.has(item.id)) {
            notExpanded.push(item.id);
          }
          collect(item.children ?? []);
        }
      });
    };
    collect(nodes);
    return new Set(notExpanded);
  });

  const onToggleExpanded = useCallback((nodeId: string) => {
    setCollapsedIds(current => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const visibleRows = useMemo(
    () => flattenVisibleRows(nodes, collapsedIds),
    [nodes, collapsedIds]
  );

  const [focusedId, setFocusedId] = useState<string | undefined>();
  const rowElements = useRef(new Map<string, HTMLElement>());

  const rowRef = useCallback((nodeId: string, element: HTMLElement | null) => {
    if (element) {
      rowElements.current.set(nodeId, element);
    } else {
      rowElements.current.delete(nodeId);
    }
  }, []);

  const effectiveFocusedId =
    focusedId && visibleRows.some(({ node }) => node.id === focusedId)
      ? focusedId
      : visibleRows[0]?.node.id;

  const focusRow = useCallback((nodeId?: string) => {
    if (!nodeId) {
      return;
    }
    setFocusedId(nodeId);
    rowElements.current.get(nodeId)?.focus();
  }, []);

  const onRowKeyDown = useCallback(
    (nodeId: string, event: React.KeyboardEvent) => {
      const HANDLED_KEYS = [
        'ArrowDown',
        'ArrowUp',
        'ArrowRight',
        'ArrowLeft',
        'Enter',
        ' ',
      ];
      if (!HANDLED_KEYS.includes(event.key)) {
        return;
      }
      // Rows nest DOM-wise: keep handled keys from bubbling to ancestor rows
      // (which would move/toggle twice).
      event.stopPropagation();
      const index = visibleRows.findIndex(({ node }) => node.id === nodeId);
      const row = visibleRows[index];
      if (!row) {
        return;
      }
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusRow(visibleRows[index + 1]?.node.id);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusRow(visibleRows[index - 1]?.node.id);
          break;
        case 'ArrowRight':
          if (row.hasChildren && !row.isExpanded) {
            onToggleExpanded(nodeId);
          } else if (row.hasChildren) {
            // Move to the first child row.
            focusRow(visibleRows[index + 1]?.node.id);
          }
          break;
        case 'ArrowLeft':
          if (row.hasChildren && row.isExpanded) {
            onToggleExpanded(nodeId);
          } else {
            focusRow(row.parentId);
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!row.node.disabled) {
            if (row.hasChildren) {
              onToggleExpanded(nodeId);
            }
            onNodeClick?.(nodeId);
          }
          break;
        default:
          break;
      }
    },
    [visibleRows, focusRow, onToggleExpanded, onNodeClick]
  );

  return (
    <Box role="tree" aria-label={ariaLabel}>
      {nodes.map(node => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        return (
          <DirectoryTreeRow
            key={node.id}
            row={{
              node,
              level: 1,
              hasChildren,
              isExpanded: hasChildren && !collapsedIds.has(node.id),
            }}
            collapsedIds={collapsedIds}
            onToggleExpanded={onToggleExpanded}
            onNodeClick={onNodeClick}
            onActionClick={onActionClick}
            focusedId={effectiveFocusedId}
            rowRef={rowRef}
            onRowKeyDown={onRowKeyDown}
          />
        );
      })}
    </Box>
  );
};

export default DirectoryTree;
