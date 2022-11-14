<template>
  <div class="webRTC">
    <video id="localVideo" autoplay playsinline muted></video>
    <div>
      <a-space>
        <a-button @click="takePhoto">拍照</a-button>
        <a-select :options="[{label:'1',value:'2'}]"></a-select>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
// 获取本地音视频流
const getLocalStream = (constraints) => {
  // 获取媒体流
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    // 将媒体流设置到 video 标签上播放
    const videoEl = document.getElementById("localVideo")
    videoEl.srcObject = stream
  })
}

// getLocalStream({
//   audio: false,
//   video: {
//     width: 1280,
//     height: 720,
//   },
// })

// 获取所有视频输入设备
const getDevices = () => {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    let videoDevices = devices.filter((device) => device.kind === "videoinput")
  })
}
//切换设备
const handleDeviceChange = (deviceId) => {
  getLocalStream({
    audio: false,
    video: {
      deviceId: { exact: deviceId },
      facingMode: { exact: val === 1 ? 'user' : 'environment' },//前置后置
    },
  })
}

//拍照
const imgList = ref([])
const takePhoto = () => {
  const videoEl = document.getElementById("localVideo")
  const canvas = document.createElement("canvas")
  canvas.width = videoEl.videoWidth
  canvas.height = videoEl.videoHeight
  const ctx = canvas.getContext("2d")
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
  imgList.value.push(canvas.toDataURL("image/png"))

  //添加滤镜
  // const filterList = [
  //   "blur(5px)", // 模糊
  //   "brightness(0.5)", // 亮度
  //   "contrast(200%)", // 对比度
  //   "grayscale(100%)", // 灰度
  //   "hue-rotate(90deg)", // 色相旋转
  //   "invert(100%)", // 反色
  //   "opacity(90%)", // 透明度
  //   "saturate(200%)", // 饱和度
  //   "saturate(20%)", // 饱和度
  //   "sepia(100%)", // 褐色
  //   "drop-shadow(4px 4px 8px blue)", // 阴影
  // ]
  // for (let i = 0; i < filterList.length; i++) {
  //   ctx.filter = filterList[i]
  //   ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
  //   imgList.value.push(canvas.toDataURL("image/png"))
  // }
}
</script>

<style scoped lang="less">
.webRTC {
  video {
    width: 640px;
    height: 360px;
  }
}
</style>
