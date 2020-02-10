<template>
    <div ref="slide" class="swiper-slide">
        <slot></slot>
    </div>
</template>

<script>
    export default {
        name: 'SwiperSlide',
        props: {
            position: {
                type: String,
                default: 'top'
            }
        }
    }
</script>

<style scoped lang="less">
    .swiper-slide {
        width: 100%;
        height: 100%;
        flex-shrink: 0;
    }
</style>
