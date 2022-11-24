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
          >结束录制（{{ seconds }}s）</a-button
        >
      </a-space>
    </a-form>
    <div class="UserMedia_images">
      <div class="image" v-for="(item, index) in imgList" :key="index">
        <img :src="item" alt="" />
        <download-outlined class="download" @click="downloadImage(item)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { DownloadOutlined } from "@ant-design/icons-vue"

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
  const deviceId = videoDevices.value[0].deviceId
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
    mimeType: currentMimeType.value,
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

// Base64 to Blob
const dataURLtoBlob = (dataurl) => {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
//下载base64
const downloadImage = (base64) => {
  // const a = document.createElement("a")
  // a.href = base64
  // a.download = `photo${new Date().getTime()}.png`
  // a.click()
  const blob = dataURLtoBlob(base64)
  downloadBlob(blob)
}
</script>

<style scoped lang="less">
.UserMedia {
  background-color: aliceblue;
  video {
    width: 640px;
    height: 360px;
  }
  &_images {
    display: flex;
    flex-wrap: wrap;
    .image {
      position: relative;
      margin-right: 20px;
      width: 320px;
      height: 180px;
      img {
        width: 100%;
        height: 100%;
      }
      .download {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        right: 10px;
        bottom: 10px;
        width: 30px;
        height: 30px;
        background-color: #fff;
        border-radius: 50%;
        cursor: pointer;
      }
    }
  }
}
</style>
