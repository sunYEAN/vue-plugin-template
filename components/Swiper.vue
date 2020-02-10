<template>
    <div class="full-container" :class="'swiper-' + direction">
        <div ref="wrapper"
             class="full-wrapper"
             :class="direction + '-wrapper'"
             :style="[translateOffset, transition]"
        >
            <slot></slot>
        </div>
        <div v-if="showBar" class="dot-wrapper" :class="'dot-' + direction">
            <ul class="dots">
                <li @click="handleDotClick($event, index)" class="dot" :class="{'dot-active': currentPage === index}"
                    v-for="(i, index) in offsets" :key="index"></li>
            </ul>
        </div>
    </div>
</template>

<script>
    import {getTransitionEndPrefix, toggleEvent, getMouseWheelEventName} from './utils'

    const __hasNoTransitionEndEvent = getTransitionEndPrefix()
    export default {
        name: 'swiper',
        props: {
            type: {
                type: String,
                // offset | full
                default: 'full'
            },
            current: {
                type: Number,
                default: 0
            },
            showBar: {
                type: Boolean,
                default: true
            },
            interval: {
                type: Number,
                default: 700
            },
            direction: {
                type: String,
                default: 'vertical'
            },
            touchOffset: {
                type: Number,
                default: 100
            },
            useMouse: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                inited: false,
                offsets: [],
                currentPage: this.current
            }
        },
        computed: {
            currentItem() {
                return this.offsets[this.currentPage] || {}
            },
            translateOffset() {
                const offset = this.currentItem.offset || 0
                const y = this.direction === 'vertical' ? offset : 0
                const x = this.direction === 'horizontal' ? offset : 0
                return {
                    transform: `translate(${-x}px, ${-y}px)`
                }
            },
            transition() {
                return {
                    transition: !this.inited ? 'none' : `all ${this.interval}ms ease`
                }
            }
        },
        methods: {
            /**
             * 监听滚轮滚动
             * @param status
             */
            addMouseWheelEvent(status) {
                const MouseWheelEventName = getMouseWheelEventName()
                if (MouseWheelEventName === 'DOMMouseScroll') toggleEvent(document, 'MozMousePixelScroll', this.handleMouseWheel, status)
                else toggleEvent(document, MouseWheelEventName, this.handleMouseWheel, status)
            },

            /**
             *
             * @param type  to | by
             * @param page
             * @param currently
             */
            scroll(type, page, {currently = false}) {
                // 滚动期间锁住
                if (this.__lockEvent && !currently) {
                    return
                }
                this.__lockEvent = true

                // 滚动当前页 后或者前 几页
                if (type === 'by') {
                    page = this.currentPage + page
                }
                // 处理页面边界问题
                const temp = Math.min(Math.max(0, page), this.offsets.length - 1)
                if (this.currentPage === temp) {
                    this.__lockEvent = false
                    return
                }
                this.currentPage = temp

                // 兼容滚动动画完成
                __hasNoTransitionEndEvent && setTimeout(() => {
                    this.$emit('onChange', this.currentPage)
                    this.__lockEvent = false
                }, this.interval)
            },
            goPageBy(page, {currently = false}) {
                this.scroll('by', page, {currently})
            },
            goPageTo(page, {currently = false}) {
                this.scroll('to', page, {currently})
            },

            /**
             * 监听滚轮滚动
             * @param e
             */
            handleMouseWheel(e) {
                const temp = e.deltaY < 0 ? -1 : 1
                this.goPageBy(temp, {currently: false})
            },
            handleStart(type) {
                return (e) => {
                    // 如果是鼠标事件
                    if (type === 'mouse') {
                        this.__mouseD = true
                    }
                    this.__start = {
                        X: type === 'touch' ? e.touches[0].pageX : e.pageX,
                        Y: type === 'touch' ? e.touches[0].pageY : e.pageY
                    }
                }
            },
            handleMove(type) {
                return (e) => {
                    e.preventDefault()

                    // 如果是mouse事件，且鼠标没有按下
                    if (type === 'mouse') {
                        if (!this.__mouseD) return
                    }
                    let point = {
                        X: type === 'touch' ? e.touches[0].pageX : e.pageX,
                        Y: type === 'touch' ? e.touches[0].pageY : e.pageY
                    }
                    // 方向已经锁定 X | Y
                    if (this.__lockD) {
                        // 横向轮播 并且 锁定了Y轴
                        if (this.direction === 'horizontal') {
                            this.__lockD === 'X' ? (point.X = this.__start.X) : e.stopPropagation()
                        } else if (this.direction === 'vertical') {
                            this.__lockD === 'Y' ? (point.Y = this.__start.Y) : e.stopPropagation()
                        }
                    } else {
                        // 横向多，锁定Y 否则锁定 X
                        this.__lockD = Math.abs(point.X - this.__start.X) >= Math.abs(point.Y - this.__start.Y) ? 'Y' : 'X'
                    }
                    this.__touch = point
                }
            },
            handleEnd() {
                return (e) => {
                    e.preventDefault()
                    // 如果没有触发过moving return
                    if (!this.__touch) return
                    let dire = this.direction === 'vertical' ? 'Y' : 'X'
                    let temp = this.__touch[dire] - this.__start[dire]
                    let page = 0
                    if (temp > this.touchOffset) {
                        page = -1
                    } else if (temp < -this.touchOffset) {
                        page = 1
                    }
                    // 重置move
                    this.__touch = null
                    this.__lockD = null
                    this.__mouseD = false
                    this.goPageBy(page, {currently: false})
                }
            },
            handleResize() {
                clearTimeout(this.__resizeTimer)
                this.__resizeTimer = setTimeout(() => {
                    console.log(13)
                    this.getSlidesOffset()
                    // 添加事件监听
                }, 200)
            },
            handleTransitionEnd(e) {
                if (e.target === this.$refs.wrapper) this.__lockEvent = false
            },

            /**
             * 监听dot点击
             */
            handleDotClick(e, index) {
                this.goPageTo(index, {currently: true})
            },

            /**
             * 监听用户交互事件
             * @param isRemove
             */
            toggleUserEvent(isRemove) {
                const $elWrapper = this.$refs.wrapper
                // 添加滚轮监听事件
                this.direction === 'vertical' && this.addMouseWheelEvent(isRemove)
                toggleEvent($elWrapper, 'touchstart', this.handleStart('touch'), isRemove)
                toggleEvent($elWrapper, 'touchmove', this.handleMove('touch'), isRemove)
                toggleEvent($elWrapper, 'touchend', this.handleEnd(), isRemove)

                toggleEvent(window, 'resize', this.handleResize, isRemove)

                if (this.useMouse) {
                    toggleEvent($elWrapper, 'mousedown', this.handleStart('mouse'), isRemove)
                    toggleEvent($elWrapper, 'mousemove', this.handleMove('mouse'), isRemove)
                    toggleEvent($elWrapper, 'mouseup', this.handleEnd(), isRemove)
                }

                // 是否有transitionEnd事件
                if (__hasNoTransitionEndEvent) {
                    toggleEvent($elWrapper, __hasNoTransitionEndEvent, this.handleTransitionEnd, isRemove)
                }
            },

            /**
             * 计算slide 到文档顶部的距离
             */
            calculateOffset(offsetOb, key, arr) {
                let wB, cB, rB, o, O, t
                let $elWrapper = this.$refs.wrapper
                let {position, width, height, offset} = offsetOb

                if (!key) offsetOb.offset = 0
                else {
                    // 子元素的宽高
                    t = this.direction === 'horizontal' ? width : height
                    o = this.direction === 'horizontal' ? 'width' : 'height'
                    O = this.direction === 'horizontal' ? 'Width' : 'Height'

                    // wrapper的   宽高
                    wB = $elWrapper[`client${O}`]
                    cB = arr.reduce((prev, next) => prev + next[o], 0)// slides总的  宽高
                    rB = arr.slice(key + 1).reduce((prev, next) => prev + next[o], 0)// rest剩余的  宽高

                    // 当内容的总高度小于wrapper的时候
                    if (cB <= wB) offsetOb.offset = 0
                    else {
                        let temp
                        switch (position) {
                            case 'top':
                                // 顶部对齐后，底部剩下的距离
                                temp = wB - t
                                if (rB < temp) temp = offset - wB + t
                                else temp = offset
                                offsetOb.offset = Math.max(0, Math.min(offset, temp))
                                break
                            case 'center':
                                // 剩下slide的高度总和
                                temp = (wB - t) / 2
                                if (rB < temp) temp = offset - wB + t
                                else temp = offset - temp
                                // 如果剩下的高度够这一个slide居中，则居中，否则该slide底部对齐swiper底部
                                offsetOb.offset = Math.max(0, Math.min(offset, temp))
                                break
                            case 'bottom':
                                temp = offset - (wB - t)
                                offsetOb.offset = Math.max(0, temp)
                        }
                    }
                }
                return offsetOb
            },
            /**
             * 计算每个slide 到文档顶部的距离
             */
            getSlidesOffset() {
                // 遍历子实例，获取节点到顶部的距离
                const offsets = this.$children.map((vm, key) => ({
                    key,
                    width: vm.$el.clientWidth,
                    height: vm.$el.clientHeight,
                    offset: this.direction === 'horizontal' ? vm.$el.offsetLeft : vm.$el.offsetTop,
                    position: vm.position
                }))

                this.offsets = offsets.map(this.calculateOffset)

                this.$nextTick(() => {
                    this.inited = true
                })
            }
        },
        mounted() {
            this.getSlidesOffset()
            // 添加事件监听
            this.toggleUserEvent(false)
        },
        beforeDestroy() {
            // 销毁事件监听
            this.toggleUserEvent(true)
        }
    }
</script>

<style scoped lang="less">
    ul {
        margin: 0;
        padding: 0;
    }

    ul > li {
        list-style: none;
    }

    .full-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
    }

    .full-container > .full-wrapper {
        width: 100%;
        height: 100%;
    }

    .full-container > .dot-wrapper {
        z-index: 100;
        display: flex;
        position: absolute;
        align-items: center;
        justify-content: center;
    }

    .full-container > .dot-wrapper > .dots > .dot {
        width: 10px;
        height: 10px;
        padding: 10px;
        position: relative;
    }

    .full-container > .dot-wrapper > .dots > .dot:hover {
        cursor: pointer;
    }

    .full-container > .dot-wrapper > .dots > .dot:after {
        top: 50%;
        left: 50%;
        width: 4px;
        height: 4px;
        display: block;
        content: '';
        position: absolute;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        transition: all 0.3s linear;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .full-container > .dot-wrapper > .dots > .dot-active:after {
        width: 10px;
        height: 10px;
        background-color: #333;
    }

    /* 水平滚动 */
    .full-container > .dot-horizontal {
        width: 100%;
        bottom: 20px;
    }

    .full-container > .dot-horizontal > .dots {
        text-align: center;
    }

    .full-container > .dot-horizontal > .dots > .dot {
        display: inline-block;
    }

    /* 竖直滚动 */
    .full-container > .dot-vertical {
        top: 0;
        right: 20px;
        height: 100%;
    }

    .full-container > .horizontal-wrapper {
        display: flex;
    }
</style>
