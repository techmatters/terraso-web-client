/*
 * Copyright © 2021-2023 Technology Matters
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

// Based on https://github.com/bluepeter/react-middle-ellipsis

import { useCallback } from 'react';

const Component = props => {
  const prepEllipses = useCallback(node => {
    const parent = node.parentNode;
    const targetTextNode = node.childNodes[0];

    if (targetTextNode !== null) {
      if (targetTextNode.hasAttribute('data-original')) {
        targetTextNode.textContent =
          targetTextNode.getAttribute('data-original');
      }

      ellipses(
        node.offsetWidth < parent.offsetWidth ? node : parent,
        targetTextNode
      );
    }
  }, []);
  const measuredParent = useCallback(
    node => {
      if (node !== null) {
        window.addEventListener('resize', () => {
          prepEllipses(node);
        });
        prepEllipses(node);
      }
    },
    [prepEllipses]
  );

  return (
    <span
      ref={measuredParent}
      style={{
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        ...(props.width && { width: props.width }),
      }}
    >
      {props.children}
    </span>
  );
};

const ellipses = (parentNode, textNode) => {
  const containerWidth = parentNode.offsetWidth;
  const textWidth = textNode.offsetWidth;

  if (textWidth > containerWidth) {
    const characterCount = textNode.textContent.length;
    const avgLetterSize = textWidth / characterCount;
    const canFit = containerWidth / avgLetterSize;
    const charactersToRemove = (characterCount - canFit + 5) / 2;
    const endLeft = Math.floor(characterCount / 2 - charactersToRemove);
    const startRight = Math.ceil(characterCount / 2 + charactersToRemove);
    const startText = textNode.textContent.substr(0, endLeft);
    const endText = textNode.textContent.substr(startRight);

    textNode.setAttribute('data-original', textNode.textContent);
    textNode.textContent = `${startText}…${endText}`;
  }
};

export default Component;
