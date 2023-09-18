import React, { useEffect, useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';

// Work around for react-beautiful-dnd issue. The issues is that the
// Droppable component is not compatible with React.StrictMode.
// StricMode is used in the development environment by default.
// See:
// - https://stackoverflow.com/a/75807063
// - https://github.com/atlassian/react-beautiful-dnd/issues/2396
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

export default StrictModeDroppable;
