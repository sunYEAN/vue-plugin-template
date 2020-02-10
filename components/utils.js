export function getTransitionEndPrefix () {
  let el = document.createElement('div')
  let transitions = {
    'transition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'MozTransition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd'
  }
  for (let t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t]
    }
  }
}
/**
 * 兼容监听或者移除事件
 * @param ele
 * @param eventName
 * @param handler
 * @param remove
 * @returns {*}
 */
export function toggleEvent (ele, eventName, handler, remove = false) {
  // 兼容事件监听
  if (ele.addEventListener) {
    return ele[!remove ? 'addEventListener' : 'removeEventListener'](eventName, handler)
  } else if (ele.attachEvent) {
    return ele[!remove ? 'attachEvent' : 'detachEvent']('on' + eventName, handler)
  } else {
    if (!remove) ele['on' + eventName] = handler
  }
}

/**
 *  滚轮事件 获取浏览器兼容后的滚轮事件名称
 */
export function getMouseWheelEventName () {
  return 'onwheel' in document.createElement('div') ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll'
}
