<template>
  <view class="login-container">
    <view class="header">
      <text class="title">欢迎登录</text>
      <text class="subtitle">C2C 二手交易平台</text>
    </view>

    <view class="form-box">
      <view class="input-item">
        <text class="label">账号</text>
        <input class="input" type="text" v-model="formData.username" placeholder="请输入账号" />
      </view>
      <view class="input-item">
        <text class="label">密码</text>
        <input class="input" type="password" v-model="formData.password" placeholder="请输入密码" />
      </view>
    </view>

    <button class="login-btn" @click="handleLogin">登 录</button>

    <view class="toggle-box" @click="goToRegister">
      <text>没有账号？极速注册 ></text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/request.js';

const formData = ref({
  username: '',
  password: ''
});

const handleLogin = async () => {
  if (!formData.value.username || !formData.value.password) {
    return uni.showToast({ title: '请输入账号和密码', icon: 'none' });
  }

  uni.showLoading({ title: '登录中...' });
  try {
    const res = await request({
      url: '/api/user/login',
      method: 'POST',
      data: formData.value
    });

    uni.hideLoading();
    uni.setStorageSync('token', res.data.token);
    uni.setStorageSync('userId', res.data.userId);
    uni.showToast({ title: '登录成功', icon: 'success' });

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' });
    }, 1000);
  } catch (error) {
    uni.hideLoading();
  }
};

// 🚨 新增跳转注册页的方法
const goToRegister = () => {
  uni.navigateTo({ url: '/pages/login/register' });
};
</script>

<style scoped>
.login-container { min-height: 100vh; background-color: #fff; padding: 60px 30px; box-sizing: border-box; }
.header { margin-bottom: 50px; text-align: center; }
.title { font-size: 28px; font-weight: bold; color: #333; display: block; margin-bottom: 10px; }
.subtitle { font-size: 16px; color: #ff4142; letter-spacing: 1px; }
.form-box { margin-bottom: 40px; }
.input-item { border-bottom: 1px solid #eee; padding: 15px 0; margin-bottom: 15px; }
.label { font-size: 14px; color: #333; margin-bottom: 10px; display: block; font-weight: bold; }
.input { font-size: 16px; height: 40px; color: #333; }
.login-btn { background: linear-gradient(90deg, #ff4142, #ff7a7b); color: #fff; font-size: 18px; font-weight: bold; border-radius: 25px; height: 50px; line-height: 50px; box-shadow: 0 4px 15px rgba(255, 65, 66, 0.3); margin-bottom: 20px; }
.login-btn::after { border: none; }
.toggle-box { text-align: center; font-size: 14px; color: #666; padding: 10px; }
</style>