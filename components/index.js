import FullScroll from './Swiper.vue'
import FullSlide from './SwiperSlide.vue'

function install(Vue) {
  Vue.component('FullScroll', FullScroll);
  Vue.component('FullSlide', FullSlide);
}
export default {install, FullScroll, FullSlide};

export {
  install,
  FullScroll,
  FullSlide
}
