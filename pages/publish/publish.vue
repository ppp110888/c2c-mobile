<template>
  <view class="publish-container">
    <view class="form-group">
      <view class="title-row">
        <input class="input-title" type="text" v-model="form.title" placeholder="请输入宝贝标题..." />
        <view class="ai-btn title-btn" :class="{ loading: aiLoadingTitle }" @click="handleAIDescribe('title')">
          <text v-if="!aiLoadingTitle">AI标题</text>
          <text v-else>⏳</text>
        </view>
      </view>
      <view class="title-row" style="border-bottom: none; margin-bottom: 6px; padding-bottom: 0;">
        <textarea class="input-content" v-model="form.content" placeholder="描述一下你的宝贝细节，新旧程度，入手渠道，转手原因等..."></textarea>
      </view>
      <view class="ai-actions">
        <view class="ai-btn desc-btn" :class="{ loading: aiLoadingDesc }" @click="handleAIDescribe('content')">
          <text v-if="!aiLoadingDesc">AI描述</text>
          <text v-else>⏳ 识别中...</text>
        </view>
        <view class="clear-btn" @click="clearContent">清空内容</view>
      </view>
    </view>

    <view class="img-grid-box">
      <view class="img-item" v-for="(img, index) in imageList" :key="index">
        <image class="preview-img" :src="img.local" mode="aspectFill"></image>
        <view class="del-btn" @click="removeImage(index)">×</view>
        <view class="uploading-mask" v-if="img.status === 'uploading'">
           <text class="loading-text">上传中</text>
        </view>
      </view>

      <view class="upload-btn" @click="chooseAndUploadImage" v-if="imageList.length < 9">
        <text class="plus">📷</text>
        <text class="upload-text">{{ imageList.length }}/9</text>
      </view>
    </view>

    <view class="form-group config-group">
      <view class="config-item">
        <text class="label">价格 (元)</text>
        <input class="input-right" type="digit" v-model="form.price" placeholder="0.00" />
      </view>
      <view class="config-item">
        <text class="label">原价 (元)</text>
        <input class="input-right" type="digit" v-model="form.originalPrice" placeholder="0.00" />
      </view>
      <view class="config-item">
        <text class="label">成色 (1-10)</text>
        <input class="input-right" type="number" v-model="form.conditionLevel" placeholder="如: 9 代表99新" />
      </view>
      <view class="config-item">
        <text class="label">发货城市</text>
        <input class="input-right" type="text" v-model="form.city" placeholder="例如：上海市" />
      </view>
    </view>

    <button class="publish-btn" @click="submitPublish">确认发布</button>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { request } from '@/utils/request.js';
import { API_BASE_URL } from '@/utils/config.js';

const form = ref({
  title: '', content: '', price: '', originalPrice: '', conditionLevel: '9', city: '', categoryId: 1,
  images: ''
});

const imageList = ref([]);
const aiLoadingTitle = ref(false);
const aiLoadingDesc = ref(false);

// 🤖 AI 识别图片生成标题或描述（分开调用）
const handleAIDescribe = async (type) => {
  const uploadedUrls = imageList.value
    .filter(img => img.status === 'success' && img.online)
    .map(img => img.online);

  if (uploadedUrls.length === 0) {
    uni.showToast({ title: '请先上传商品图片', icon: 'none' });
    return;
  }

  const targetField = type === 'title' ? '标题' : '描述';
  const hasContent = type === 'title' ? form.value.title : form.value.content;

  // 已有内容时确认覆盖
  if (hasContent) {
    const confirmRes = await uni.showModal({
      title: '提示',
      content: 'AI 将覆盖当前' + targetField + '，是否继续？'
    });
    if (!confirmRes.confirm) return;
  }

  if (type === 'title') aiLoadingTitle.value = true;
  else aiLoadingDesc.value = true;

  uni.showLoading({ title: 'AI 识别中...' });

  try {
    const res = await request({
      url: '/api/item/ai/describe',
      method: 'POST',
      data: { imageUrls: uploadedUrls, type: type }
    });

    uni.hideLoading();

    if (res.data && res.data.description) {
      const text = res.data.description.trim();

      if (type === 'title') {
        form.value.title = text;
      } else {
        form.value.content = text;
      }

      uni.showToast({ title: targetField + '已生成，可编辑后发布', icon: 'success' });
    } else {
      uni.showToast({ title: 'AI 暂不可用，请手动填写', icon: 'none' });
    }
  } catch (e) {
    uni.hideLoading();
    console.error('AI 生成失败', e);
    uni.showToast({ title: 'AI 服务异常，请手动填写', icon: 'none' });
  } finally {
    if (type === 'title') aiLoadingTitle.value = false;
    else aiLoadingDesc.value = false;
  }
};

// 🗑️ 一键清除标题和描述
const clearContent = () => {
  if (!form.value.title && !form.value.content) return;
  uni.showModal({
    title: '清空确认',
    content: '确定要清除标题和描述吗？',
    success: (res) => {
      if (res.confirm) {
        form.value.title = '';
        form.value.content = '';
        uni.showToast({ title: '已清空', icon: 'none', duration: 1000 });
      }
    }
  });
};

const chooseAndUploadImage = () => {
  const maxCount = 9 - imageList.value.length;
  if (maxCount <= 0) return;

  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach(path => {
        uploadSingleImage(path);
      });
    }
  });
};

const uploadSingleImage = (filePath) => {
  // 使用 reactive 解决 Vue 响应式不更新遮罩的问题
  const imgObj = reactive({ local: filePath, online: '', status: 'uploading' });
  imageList.value.push(imgObj);

  const token = uni.getStorageSync('token');

  uni.uploadFile({
    url: `${API_BASE_URL}/api/item/file/upload`,
    filePath: filePath,
    name: 'file',
    header: {
      'Authorization': token ? `Bearer ${token}` : ''
    },
    success: (uploadRes) => {
      const resData = JSON.parse(uploadRes.data);
      if (resData.code === 200) {
        imgObj.online = resData.data; 
        imgObj.status = 'success';
        updateFormImages(); 
      } else {
        imgObj.status = 'error';
        uni.showToast({ title: '图片上传失败', icon: 'none' });
      }
    },
    fail: (err) => {
      imgObj.status = 'error';
      console.error('上传失败', err);
    }
  });
};

const removeImage = (index) => {
  imageList.value.splice(index, 1);
  updateFormImages();
};

const updateFormImages = () => {
  form.value.images = imageList.value
    .filter(item => item.status === 'success' && item.online)
    .map(item => item.online)
    .join(',');
};

const submitPublish = async () => {
  if (!uni.getStorageSync('token')) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!form.value.title || !form.value.price) {
    uni.showToast({ title: '标题和价格必填', icon: 'none' });
    return;
  }
  if (imageList.value.some(img => img.status === 'uploading')) {
     uni.showToast({ title: '图片还在上传中，请稍后...', icon: 'none' });
     return;
  }

  uni.showLoading({ title: '发布中...' });

  try {
    await request({ url: '/api/item/publish', method: 'POST', data: form.value });
    uni.hideLoading();
    uni.showToast({ title: '🎉 发布成功！', icon: 'success' });
    
    // 🚨 变成底部导航栏后，跳转首页必须用 switchTab
    setTimeout(() => { 
      uni.switchTab({ url: '/pages/index/index' }); 
      // 可选：发布完清理一下表单
      form.value = { title: '', content: '', price: '', originalPrice: '', conditionLevel: '9', city: '', categoryId: 1, images: '' };
      imageList.value = [];
    }, 1000);
  } catch (error) {
    uni.hideLoading();
    console.error("发布异常：", error);
  }
};
</script>

<style scoped>
.publish-container { min-height: 100vh; background-color: #f6f6f6; padding: 15px; padding-bottom: 60px;}
.form-group { background-color: #fff; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.title-row { display: flex; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 12px; }
.input-title { font-size: 18px; font-weight: bold; flex: 1; }
.input-content { width: 100%; height: 100px; font-size: 14px; line-height: 1.6; color: #333; }

/* AI 按钮组 */
.ai-actions { display: flex; align-items: center; gap: 10px; }
.ai-btn { color: #fff; font-size: 11px; padding: 6px 14px; border-radius: 15px; white-space: nowrap; font-weight: bold; transition: all 0.2s; }
.ai-btn:active { opacity: 0.8; transform: scale(0.95); }
.ai-btn.loading { background: #999 !important; pointer-events: none; }
.title-btn { background: linear-gradient(135deg, #667eea, #764ba2); }
.desc-btn { background: linear-gradient(135deg, #f093fb, #f5576c); flex: 1; text-align: center; }
.clear-btn { font-size: 11px; color: #999; border: 1px solid #ddd; padding: 6px 14px; border-radius: 15px; white-space: nowrap; }
.clear-btn:active { background: #f5f5f5; }

.img-grid-box { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; background: #fff; padding: 15px; border-radius: 12px;}
.img-item, .upload-btn { width: calc((100vw - 80px) / 3); height: calc((100vw - 80px) / 3); border-radius: 8px; position: relative; overflow: hidden;}
.upload-btn { background: #fafafa; border: 1px dashed #ddd; display: flex; flex-direction: column; align-items: center; justify-content: center;}
.preview-img { width: 100%; height: 100%; }
.del-btn { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; width: 22px; height: 22px; line-height: 20px; text-align: center; border-bottom-left-radius: 8px; font-size: 14px; z-index: 2;}
.plus { font-size: 28px; color: #999; margin-bottom: 2px;}
.upload-text { font-size: 10px; color: #999; }
.uploading-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1;}
.loading-text { color: #fff; font-size: 12px; }

.config-group { padding: 5px 15px; }
.config-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding: 15px 0; }
.config-item:last-child { border-bottom: none; }
.label { font-size: 15px; color: #333; font-weight: 500;}
.input-right { text-align: right; font-size: 15px; color: #333; }
.publish-btn { background: linear-gradient(90deg, #ff4142, #ff7a7b); color: #fff; border-radius: 25px; font-size: 16px; font-weight: bold; height: 50px; line-height: 50px; margin-top: 30px; box-shadow: 0 4px 15px rgba(255, 65, 66, 0.4); }
.publish-btn::after { border: none; }
</style>
