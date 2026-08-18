<template>
  <div class="slider-captcha">
    <div class="captcha-board" :class="{ verified: modelValue }">
      <div class="captcha-art"></div>
      <div v-if="challenge" class="captcha-slot" :style="{ left: `${challenge.targetOffset}px` }"></div>
      <div v-if="challenge" class="captcha-piece" :style="{ left: `${position}px` }"></div>
      <div v-if="modelValue" class="captcha-success">验证成功</div>
    </div>
    <div class="slider-track">
      <div class="slider-progress" :style="{ width: `${position + 42}px` }"></div>
      <button
        class="slider-handle"
        type="button"
        :disabled="!challenge || modelValue"
        :style="{ left: `${position}px` }"
        aria-label="拖动图块完成验证"
        @pointerdown.prevent="startDrag"
      >{{ modelValue ? '✓' : '→' }}</button>
      <span v-if="!modelValue" class="slider-placeholder">拖动滑块完成验证</span>
      <span v-else class="slider-placeholder success-text">验证通过</span>
    </div>
    <div class="captcha-actions">
      <span class="captcha-tip">请将图块拖到缺口处</span>
      <el-button link type="primary" size="small" @click="refresh">刷新</el-button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  challenge: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'verified', 'refresh'])

const position = ref(0)
let dragStartX = 0
let dragStartPosition = 0

const maxPosition = () => Math.max(0, (props.challenge?.trackWidth || 300) - 50)
const clamp = (value) => Math.max(0, Math.min(maxPosition(), value))

function startDrag(event) {
  if (!props.challenge || props.modelValue) return
  dragStartX = event.clientX
  dragStartPosition = position.value
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', endDrag, { once: true })
}

function moveDrag(event) {
  position.value = clamp(dragStartPosition + event.clientX - dragStartX)
}

function endDrag() {
  window.removeEventListener('pointermove', moveDrag)
  const target = props.challenge?.targetOffset
  if (target == null) return
  if (Math.abs(position.value - target) <= 6) {
    position.value = target
    emit('update:modelValue', true)
    emit('verified', target)
  } else {
    position.value = 0
  }
}

function refresh() {
  position.value = 0
  emit('update:modelValue', false)
  emit('refresh')
}

watch(() => props.challenge, () => {
  position.value = 0
  emit('update:modelValue', false)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', endDrag)
})
</script>

<style scoped>
.slider-captcha { width: 100%; max-width: 300px; }
.captcha-board {
  position: relative;
  width: 300px;
  max-width: 100%;
  height: 112px;
  overflow: hidden;
  border: 1px solid #dce4f0;
  border-radius: 8px;
  background: #edf4ff;
}
.captcha-art {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 30%, rgba(79, 110, 247, .45) 0 15px, transparent 16px),
    radial-gradient(circle at 78% 72%, rgba(46, 170, 120, .42) 0 22px, transparent 23px),
    linear-gradient(135deg, #d9e6ff 0%, #f7fbff 45%, #d8f1ea 100%);
}
.captcha-art::after {
  content: 'QCT';
  position: absolute;
  right: 22px;
  top: 22px;
  color: rgba(63, 91, 155, .25);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: .12em;
  transform: rotate(-12deg);
}
.captcha-slot,
.captcha-piece {
  position: absolute;
  top: 34px;
  width: 50px;
  height: 50px;
  border-radius: 8px;
}
.captcha-slot {
  border: 2px dashed rgba(53, 96, 208, .72);
  background: rgba(79, 110, 247, .18);
}
.captcha-piece {
  z-index: 1;
  border: 2px solid #fff;
  background: linear-gradient(135deg, #6a8dff, #4f6ef7 55%, #2eaa78);
  box-shadow: 0 3px 8px rgba(44, 74, 136, .3);
  transition: left .16s ease;
}
.captcha-success {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(46, 170, 120, .78);
  font-size: 18px;
  font-weight: 700;
}
.slider-track {
  position: relative;
  width: 300px;
  max-width: 100%;
  height: 40px;
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid #dce4f0;
  border-radius: 20px;
  background: #f3f6fb;
}
.slider-progress {
  position: absolute;
  inset: 0 auto 0 0;
  max-width: 100%;
  border-radius: 20px;
  background: #e4edff;
}
.slider-handle {
  position: absolute;
  top: 2px;
  z-index: 2;
  width: 36px;
  height: 34px;
  padding: 0;
  border: 1px solid #4f6ef7;
  border-radius: 18px;
  color: #fff;
  background: #4f6ef7;
  cursor: grab;
  touch-action: none;
}
.slider-handle:active { cursor: grabbing; }
.slider-handle:disabled { cursor: default; background: #2eaa78; border-color: #2eaa78; }
.slider-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #8491a7;
  font-size: 12px;
  pointer-events: none;
}
.success-text { color: #24926a; font-weight: 600; }
.captcha-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.captcha-tip { color: var(--text-secondary); font-size: 12px; }
</style>
