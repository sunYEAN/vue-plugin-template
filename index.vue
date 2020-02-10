<template>
    <div class="container">
        <full-scroll style="height: 500px;">
            <full-slide>1</full-slide>
            <full-slide>2</full-slide>
            <full-slide>3</full-slide>
        </full-scroll>
    </div>
</template>

<script>
    import {FullScroll, FullSlide} from './dist/main';
    export default {
        name: "test",
        components: {
            FullScroll,
            FullSlide
        }
    }
</script>

<style scoped>

</style>
