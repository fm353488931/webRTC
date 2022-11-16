<template>
  <div class="UserMedia">
    <a-space>
      <video ref="localVideo" autoplay playsinline muted></video>
      <video ref="screenVideo" autoplay playsinline muted></video>
    </a-space>
    <a-form layout="inline">
      <a-form-item label="视频输入设备切换">
        <a-select
          v-model="currentDeviceId"
          style="width: 250px"
          @change="changeDevice"
        >
          <a-select-option v-for="item in videoDevices" :value="item.deviceId">
            {{ item.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="录制的视频格式">
        <a-select v-model="currentMimeType" style="width: 250px">
          <a-select-option v-for="item in supportedMimeTypes" :value="item">
            {{ item }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-space>
        <a-button type="primary" @click="changeVideoDevice"
          >打开摄像头</a-button
        >
        <a-button type="primary" @click="takePhoto">拍照</a-button>
        <a-button type="primary" @click="shareScreen">分享屏幕</a-button>
        <a-button type="primary" v-if="!isRecording" @click="startRecord"
          >开始录制</a-button
        >
        <a-button type="primary" v-if="isRecording" @click="stopRecord"
          >结束录制（{{ seconds }}）</a-button
        >
      </a-space>
    </a-form>
  </div>
</template>

<script setup>
import { ref } from "vue"
const localVideo = ref(null)
const screenVideo = ref(null)
// 获取本地音视频流
const getLocalStream = (constraints) => {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      localVideo.value.srcObject = stream
    })
    .catch((err) => {
      localVideo.value.srcObject = null
      window.$message.error("获取失败")
    })
}

const shareScreen = () => {
  navigator.mediaDevices
    .getDisplayMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      screenVideo.value.srcObject = stream
    })
    .catch((err) => {
      screenVideo.value.srcObject = null
      window.$message.error("获取失败")
    })
}
// 获取所有视频输入设备
const currentDeviceId = ref("")
const videoDevices = ref([])
const getDevices = () => {
  navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
    videoDevices.value = mediaDevices.filter(
      (device) => device.kind === "videoinput"
    )
  })
}
getDevices()

//打开摄像头
const changeVideoDevice = () => {
  const deviceId = videoDevices[0].deviceId
  currentDeviceId.value = deviceId
  changeDevice(deviceId)
}
//切换设备
const changeDevice = (deviceId) => {
  getLocalStream({
    audio: false,
    video: {
      deviceId: { exact: deviceId },
      // facingMode: { exact: "user" }, // user | environment | left | right 前后左右摄像头
      width: 1280,
      height: 720,
    },
  })
}

//拍照
const imgList = ref([])
const takePhoto = () => {
  const canvas = document.createElement("canvas")
  canvas.width = localVideo.value.videoWidth
  canvas.height = localVideo.value.videoHeight
  const ctx = canvas.getContext("2d")
  ctx.drawImage(localVideo.value, 0, 0, canvas.width, canvas.height)
  imgList.value.push(canvas.toDataURL("image/png"))
  console.log(imgList.value)
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
  //   ctx.drawImage(localVideo.value, 0, 0, canvas.width, canvas.height)
  //   imgList.value.push(canvas.toDataURL("image/png"))
  // }
}

// 获取支持的媒体类型
const currentMimeType = ref("")

const supportedMimeTypes = ref([])
const getSupportedMimeTypes = () => {
  const media = "video"
  // 常用的视频格式
  const types = [
    "webm",
    "mp4",
    "ogg",
    "mov",
    "avi",
    "wmv",
    "flv",
    "mkv",
    "ts",
    "x-matroska",
  ]
  // 常用的视频编码
  const codecs = ["vp9", "vp9.0", "vp8", "vp8.0", "avc1", "av1", "h265", "h264"]
  // 支持的媒体类型
  const supported = []
  const isSupported = MediaRecorder.isTypeSupported
  // 遍历判断所有的媒体类型
  types.forEach((type) => {
    const mimeType = `${media}/${type}`
    codecs.forEach((codec) =>
      [
        `${mimeType};codecs=${codec}`,
        `${mimeType};codecs=${codec.toUpperCase()}`,
      ].forEach((variation) => {
        if (isSupported(variation)) supported.push(variation)
      })
    )
    if (isSupported(mimeType)) supported.push(mimeType)
  })
  supportedMimeTypes.value = supported
}
getSupportedMimeTypes()

// 录制媒体流
const isRecording = ref(false)
const seconds = ref(0)
let timer
let mediaRecorder = null
const startRecord = () => {
  const kbps = 1024
  const Mbps = kbps * kbps
  const options = {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    mimeType: 'video/webm; codecs="vp8,opus"',
  }
  mediaRecorder = new MediaRecorder(screenVideo.value.srcObject, options)
  mediaRecorder.start()
  timer = setInterval(() => {
    seconds.value++
  }, 1000)
  isRecording.value = true

  mediaRecorder.ondataavailable = (e) => {
    // 将录制的数据合并成一个 Blob 对象
    // const blob = new Blob([e.data], { type: e.data.type })

    // 🌸重点是这个地方，我们不要把获取到的 e.data.type设置成 blob 的 type，而是直接改成 mp4
    const blob = new Blob([e.data], { type: "video/mp4" })
    downloadBlob(blob)
  }
  mediaRecorder.onstop = () => {
    // 停止录制
  }
}
const stopRecord = () => {
  mediaRecorder.stop()
  clearInterval(timer)
  isRecording.value = false
}

// 下载 Blob
const downloadBlob = (blob) => {
  // 将 Blob 对象转换成一个 URL 地址
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  // 设置 a 标签的 href 属性为刚刚生成的 URL 地址
  a.href = url
  // 设置 a 标签的 download 属性为文件名
  a.download = `${new Date().getTime()}.${blob.type.split("/")[1]}`
  // 模拟点击 a 标签
  a.click()
  // 释放 URL 地址
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="less">
.UserMedia {
  video {
    width: 640px;
    height: 360px;
  }
}
</style>
