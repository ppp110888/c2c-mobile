<template>
  <view class="publish-container">
    <view class="form-group">
      <input class="input-title" type="text" v-model="form.title" placeholder="请输入宝贝标题，品牌型号等..." />
      <textarea class="input-content" v-model="form.content" placeholder="描述一下你的宝贝细节，新旧程度，入手渠道，转手原因等..."></textarea>
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

    <button class="publish-btn" @click="submitEdit">保存修改</button>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { API_BASE_URL, mediaUrl } from '@/utils/config.js';

const form = ref({
  id: '', title: '', content: '', price: '', originalPrice: '', conditionLevel: '9', city: '', categoryId: 1, images: '' 
});

const imageList = ref([]);

onLoad((options) => {
  if (options.itemId) {
    form.value.id = options.itemId;
    fetchItemDetail(options.itemId);
  }
});

// 补全 MinIO 的完整 URL
const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return mediaUrl(url);
};

// 拉取原来的商品信息回显
const fetchItemDetail = async (id) => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: `/api/item/detail?itemId=${id}`, method: 'GET' });
    const item = res.data.item || {};
    
    form.value.title = item.title || '';
    form.value.content = item.content || '';
    form.value.price = item.price || '';
    form.value.originalPrice = item.originalPrice || '';
    form.value.conditionLevel = item.conditionLevel || '9';
    form.value.city = item.city || '';
    
    // 把现有的图片转为预览对象
    if (item.images) {
      const urls = item.images.split(',');
      imageList.value = urls.map(url => reactive({
        local: formatUrl(url), 
        online: url,           
        status: 'success'      
      }));
    }
  } catch (error) {
    console.error("获取详情失败", error);
  } finally {
    uni.hideLoading();
  }
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
  const imgObj = reactive({ local: filePath, online: '', status: 'uploading' });
  imageList.value.push(imgObj);

  const token = uni.getStorageSync('token');

  uni.uploadFile({
    url: `${API_BASE_URL}/api/item/file/upload`,
    filePath: filePath,
    name: 'file',
    header: {
      'Authorization': token || ''
    },
    success: (uploadRes) => {
      const resData = JSON.parse(uploadRes.data);
      if (resData.code === 200 || resData.code === 0) {
        imgObj.online = resData.data; 
        imgObj.status = 'success';
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
};

const updateFormImages = () => {
  form.value.images = imageList.value
    .filter(item => item.status === 'success' && item.online)
    .map(item => item.online)
    .join(',');
};

const submitEdit = async () => {
  if (!form.value.title || !form.value.price) {
    uni.showToast({ title: '标题和价格必填', icon: 'none' });
    return;
  }
  if (imageList.value.some(img => img.status === 'uploading')) {
     uni.showToast({ title: '图片还在上传中，请稍后...', icon: 'none' });
     return;
  }
  
  updateFormImages();
  if (!form.value.images) {
     uni.showToast({ title: '至少需要一张图片哦', icon: 'none' });
     return;
  }

  uni.showLoading({ title: '保存中...' });

  try {
    await request({ url: '/api/item/my/update', method: 'POST', data: form.value });
    uni.hideLoading();
    uni.showToast({ title: '修改成功！', icon: 'success' });
    
    setTimeout(() => { 
      uni.navigateBack(); 
    }, 1000);
  } catch (error) {
    uni.hideLoading();
    console.error("保存异常：", error);
  }
};
</script>

<style scoped>
.publish-container { min-height: 100vh; background-color: #f6f6f6; padding: 15px; padding-bottom: 60px;}
.form-group { background-color: #fff; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.input-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px; }
.input-content { width: 100%; height: 100px; font-size: 14px; line-height: 1.6; color: #333; }

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
