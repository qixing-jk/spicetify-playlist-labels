interface DomWithFiber extends HTMLElement {
  [key: string]: any;
}

/**
 * 从 DOM 节点获取对应的 React Fiber 节点
 * 支持 React 17/18
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
 * 向上遍历 Fiber 树获取第一个有 props 的父组件
 * @param {Object} fiber - 起始 Fiber 节点
 * @param {Function} filterFn - 可选，过滤函数，返回 true 表示匹配目标父组件
 * @returns {Object|null} - 找到的父组件 props 或 null
 */
export function getParentProps(
  fiber: { return: any },
  filterFn = (parent: any) => true,
) {
  if (!fiber) return null;

  let parent = fiber.return; // Fiber 父节点
  while (parent) {
    const props = parent.memoizedProps || parent.pendingProps;
    if (props && (!filterFn || filterFn(parent))) {
      return props;
    }
    parent = parent.return;
  }
  return null;
}
