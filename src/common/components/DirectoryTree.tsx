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

import { useCallback, useState } from 'react';
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

type DirectoryTreeRowProps = {
  node: DirectoryTreeNode;
  level: number;
  collapsedIds: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  onActionClick?: (nodeId: string) => void;
};

const DirectoryTreeRow = ({
  node,
  level,
  collapsedIds,
  onToggleExpanded,
  onNodeClick,
  onActionClick,
}: DirectoryTreeRowProps) => {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = hasChildren && !collapsedIds.has(node.id);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (node.disabled) {
        return;
      }
      if (hasChildren) {
        onToggleExpanded(node.id);
      }
      onNodeClick?.(node.id);
      event.stopPropagation();
    },
    [node.disabled, node.id, hasChildren, onToggleExpanded, onNodeClick]
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
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={node.active ?? false}
      aria-disabled={node.disabled || undefined}
      aria-level={level}
      aria-label={
        node['aria-label'] ??
        (typeof node.label === 'string' ? node.label : undefined)
      }
      onClick={handleClick}
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
              node={child}
              level={level + 1}
              collapsedIds={collapsedIds}
              onToggleExpanded={onToggleExpanded}
              onNodeClick={onNodeClick}
              onActionClick={onActionClick}
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
 * same spirit as `Tabs.tsx`.
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

  return (
    <Box role="tree" aria-label={ariaLabel}>
      {nodes.map(node => (
        <DirectoryTreeRow
          key={node.id}
          node={node}
          level={1}
          collapsedIds={collapsedIds}
          onToggleExpanded={onToggleExpanded}
          onNodeClick={onNodeClick}
          onActionClick={onActionClick}
        />
      ))}
    </Box>
  );
};

export default DirectoryTree;
