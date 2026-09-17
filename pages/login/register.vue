<template>
  <view class="register-container">
    <view class="header">
      <text class="title">注册新账号</text>
      <text class="subtitle">加入 C2C，发现海量好物</text>
    </view>

    <view class="form-box">
      <view class="input-item">
        <text class="label">设置账号</text>
        <input class="input" type="text" v-model="formData.username" placeholder="请输入字母或数字组合" />
      </view>
      <view class="input-item">
        <text class="label">设置密码</text>
        <input class="input" type="password" v-model="formData.password" placeholder="请输入至少6位密码" />
      </view>
      <view class="input-item">
        <text class="label">确认密码</text>
        <input class="input" type="password" v-model="confirmPassword" placeholder="请再次输入密码" />
      </view>
    </view>

    <button class="register-btn" @click="handleRegister">立即注册</button>

    <view class="bottom-link" @click="goBackLogin">
      <text>已有账号？直接去登录</text>
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
const confirmPassword = ref('');

const handleRegister = async () => {
  if (!formData.value.username) return uni.showToast({ title: '请输入账号', icon: 'none' });
  if (!formData.value.password) return uni.showToast({ title: '请输入密码', icon: 'none' });
  if (formData.value.password.length < 6) return uni.showToast({ title: '密码至少需要6位哦', icon: 'none' });
  if (formData.value.password !== confirmPassword.value) {
    return uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
  }

  uni.showLoading({ title: '注册中...' });
  try {
    await request({
      url: '/api/user/register',
      method: 'POST',
      data: formData.value
    });

    uni.hideLoading();
    uni.showToast({ title: '注册成功，快去登录吧！', icon: 'success' });
    
    // 注册成功后，延迟 1.5 秒自动跳回登录页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);

  } catch (error) {
    uni.hideLoading();
  }
};

const goBackLogin = () => {
  uni.navigateBack(); // 返回上一页（也就是登录页）
};
</script>

<style scoped>
.register-container { min-height: 100vh; background-color: #fff; padding: 60px 30px; box-sizing: border-box; }
.header { margin-bottom: 50px; text-align: center; }
.title { font-size: 28px; font-weight: bold; color: #333; display: block; margin-bottom: 10px; }
.subtitle { font-size: 16px; color: #ff4142; letter-spacing: 1px; }
.form-box { margin-bottom: 40px; }
.input-item { border-bottom: 1px solid #eee; padding: 15px 0; margin-bottom: 15px; }
.label { font-size: 14px; color: #333; margin-bottom: 10px; display: block; font-weight: bold; }
.input { font-size: 16px; height: 40px; color: #333; }
.register-btn { background: linear-gradient(90deg, #ff4142, #ff7a7b); color: #fff; font-size: 18px; font-weight: bold; border-radius: 25px; height: 50px; line-height: 50px; box-shadow: 0 4px 15px rgba(255, 65, 66, 0.3); margin-bottom: 20px; }
.register-btn::after { border: none; }
.bottom-link { text-align: center; font-size: 14px; color: #666; padding: 10px; }
</style>