interface DomWithFiber extends HTMLElement {
  [key: string]: any;
}

/**
 * Gets the corresponding React Fiber node from a DOM node.
 * Supports React 17/18.
 */
export function getFiberFromDom(dom: HTMLElement) {
  const fiberDom = dom as DomWithFiber;
  const props = Object.getOwnPropertyNames(fiberDom);
  for (const key of props) {
    if (
      key.startsWith("__reactFiber$") ||
      key.startsWith("__reactInternalInstance$")
    ) {
      return fiberDom[key];
    }
  }
  return null;
}

/**
 * Traverses up the Fiber tree to get the first parent component with props.
 * @param {Object} fiber - The starting Fiber node.
 * @param {Function} filterFn - Optional filter function that returns true for a matching parent.
 * @returns {Object|null} - The found parent component's props or null.
 */
export function getParentProps(
  fiber: { return: any },
  filterFn = (parent: any) => true,
) {
  if (!fiber) return null;

  let parent = fiber.return; // Fiber parent node
  while (parent) {
    const props = parent.memoizedProps || parent.pendingProps;
    if (props && (!filterFn || filterFn(parent))) {
      return props;
    }
    parent = parent.return;
  }
  return null;
}
