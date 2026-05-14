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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type UseActiveStepParams = {
  scrollRoot?: RefObject<Element | null> | null;
  onStepChange?: (id: string) => void;
  onReady?: () => void;
};

type UseActiveStepResult = {
  activeId: string | null;
  registerStep: (node: Element | null) => void;
};

const useActiveStep = ({
  scrollRoot,
  onStepChange,
  onReady,
}: UseActiveStepParams): UseActiveStepResult => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodesRef = useRef<Set<Element>>(new Set());
  const onReadyFiredRef = useRef(false);

  useEffect(() => {
    // rootMargin collapses the root to a 1px horizontal line at the
    // vertical midpoint of the scroll root (or the viewport when scrollRoot
    // is null). A registered step is "intersecting" precisely when its
    // border box crosses that line, so at any given scroll position at most
    // one step is active. threshold: 0 fires the callback on every crossing
    // of that line.
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            setActiveId(id);
            console.log(id);
          }
        }
      },
      {
        root: scrollRoot?.current ?? null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      }
    );
    observerRef.current = observer;
    // We track observed nodes in a Set so that when scrollRoot changes and
    // we build a new observer, we can re-attach it to the same step nodes
    // without relying on the consumer to remount them. This assumes the new
    // root is still an ancestor of the existing step nodes — the only
    // scrollRoot change we'd ever sensibly support, since IntersectionObserver
    // silently reports isIntersecting: false for targets outside the root's
    // subtree.
    for (const node of nodesRef.current) {
      observer.observe(node);
    }
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [scrollRoot]);

  useEffect(() => {
    if (!activeId) {
      return;
    }
    onStepChange?.(activeId);
  }, [activeId, onStepChange]);

  useEffect(() => {
    if (activeId !== null && !onReadyFiredRef.current) {
      onReadyFiredRef.current = true;
      onReady?.();
    }
  }, [activeId, onReady]);

  const registerStep = useCallback((node: Element | null) => {
    if (node) {
      nodesRef.current.add(node);
      observerRef.current?.observe(node);
    } else {
      nodesRef.current.forEach(n => {
        if (!document.contains(n)) {
          nodesRef.current.delete(n);
        }
      });
    }
  }, []);

  return { activeId, registerStep };
};

export default useActiveStep;
