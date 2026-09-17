<template>
  <view class="edit-container">
    
    <view class="avatar-section" @click="changeAvatar">
      <view class="avatar-wrap">
        <image class="avatar-img" :src="formData.avatar || 'https://picsum.photos/200/200?random=8'" mode="aspectFill"></image>
        <view class="camera-badge">📷</view>
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <view class="form-group">
      <view class="form-item">
        <text class="label">昵称</text>
        <input class="input-box" type="text" v-model="formData.nickname" placeholder="给自已起个响亮的名字" />
      </view>

      <view class="form-item">
        <text class="label">新密码</text>
        <input class="input-box" type="password" v-model="formData.password" placeholder="不修改请留空" />
      </view>

      <view class="form-item bio-item">
        <text class="label">自我介绍</text>
        <textarea 
          class="textarea-box" 
          v-model="formData.bio" 
          placeholder="介绍一下自己，比如：资深数码玩家、爽快卖家、不刀..."
          maxlength="100"
        ></textarea>
        <text class="word-count">{{ formData.bio.length }}/100</text>
      </view>
    </view>

    <view class="btn-group">
      <button class="save-btn" @click="handleSave">保存修改</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { API_BASE_URL } from '@/utils/config.js';

const formData = ref({
  nickname: '',
  password: '', 
  bio: '',
  avatar: '' // 头像字段
});

onLoad(() => {
  fetchUserInfo();
});

const fetchUserInfo = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: '/api/user/info', method: 'GET' });
    if (res.data) {
      formData.value.nickname = res.data.nickname || '';
      formData.value.bio = res.data.bio || '';
      formData.value.avatar = res.data.avatar || ''; 
    }
  } catch (error) {
    console.error('获取用户信息失败', error);
  } finally {
    uni.hideLoading();
  }
};

// 🚨 真实的 MinIO 更换头像逻辑 (已完美适配你的 FileController)
const changeAvatar = () => {
  uni.chooseImage({
    count: 1, 
    sizeType: ['compressed'], 
    sourceType: ['album', 'camera'], 
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      
      // 开始真实上传！
      uni.showLoading({ title: '图片上传中...' });
      
      uni.uploadFile({
        // 🚨 架构师精算 URL：网关前缀 /api/item + Controller路径 /item/file/upload
        url: `${API_BASE_URL}/api/item/file/upload`,
        filePath: tempFilePath,
        name: 'file', // 🚨 对应你后端的 @RequestParam("file")
        header: {
          'Authorization': uni.getStorageSync('token') || '',
        },
        success: (uploadRes) => {
          uni.hideLoading();
          
          // 解析后端返回的 JSON 字符串
          const resData = JSON.parse(uploadRes.data);
          
          // 判断是否成功 (假设你后端的 Result 成功 code 是 200 或 0)
          if (resData.code === 200 || resData.code === 0) {
            // 🚨 对应你后端的 Result.success(imageUrl)，把真实的 MinIO 链接赋给表单
            formData.value.avatar = resData.data; 
            uni.showToast({ title: '上传成功，请点击保存', icon: 'success' });
          } else {
            uni.showToast({ title: '上传失败: ' + resData.msg, icon: 'none' });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error('上传报错', err);
          uni.showToast({ title: '网络异常，请检查网关和服务', icon: 'none' });
        }
      });
    }
  });
};

const handleSave = async () => {
  if (!formData.value.nickname.trim()) {
    return uni.showToast({ title: '昵称不能为空', icon: 'none' });
  }

  uni.showLoading({ title: '保存中...' });
  try {
    const res = await request({
      url: '/api/user/update',
      method: 'POST',
      data: formData.value
    });
    
    uni.hideLoading();
    uni.showToast({ title: '修改成功！', icon: 'success' });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);

  } catch (error) {
    uni.hideLoading();
    console.error('保存失败', error);
  }
};
</script>

<style scoped>
.edit-container { min-height: 100vh; background-color: #f6f6f6; }

/* 🚨 头像区域的样式 */
.avatar-section { display: flex; flex-direction: column; align-items: center; padding: 30px 0 20px; background: #fff; margin-bottom: 12px; }
.avatar-wrap { position: relative; margin-bottom: 10px; }
.avatar-img { width: 80px; height: 80px; border-radius: 40px; background: #eee; border: 2px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.camera-badge { position: absolute; right: 0; bottom: 0; background: #ff4142; font-size: 10px; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }
.avatar-tip { font-size: 13px; color: #999; }

.form-group { background: #fff; padding: 0 20px; }
.form-item { display: flex; align-items: center; border-bottom: 1px solid #f9f9f9; padding: 15px 0; }
.form-item:last-child { border-bottom: none; }
.bio-item { flex-direction: column; align-items: flex-start; position: relative; }

.label { width: 80px; font-size: 15px; color: #333; font-weight: bold; }
.input-box { flex: 1; font-size: 15px; color: #333; height: 30px; }
.textarea-box { width: 100%; height: 100px; font-size: 15px; color: #333; margin-top: 10px; background: #f9f9f9; padding: 10px; border-radius: 8px; box-sizing: border-box; line-height: 1.5; }
.word-count { position: absolute; right: 10px; bottom: 25px; font-size: 12px; color: #999; }

.btn-group { padding: 30px 20px; }
.save-btn { background: linear-gradient(90deg, #ff4142, #ff7a7b); color: #fff; font-size: 16px; font-weight: bold; border-radius: 25px; height: 45px; line-height: 45px; box-shadow: 0 4px 10px rgba(255, 65, 66, 0.3); }
.save-btn::after { border: none; }
</style>
