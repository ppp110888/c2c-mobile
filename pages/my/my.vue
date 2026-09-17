<template>
  <view class="my-container">
    <view class="header-card" @click="uni.navigateTo({ url: '/pages/my/edit' })">
      <image class="avatar" :src="userInfo.avatar || 'https://picsum.photos/200/200?random=8'" mode="aspectFill"></image>
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '神秘玩家' }}</text>
        <text class="bio-text">{{ userInfo.bio || '这个人很懒，什么都没留下~' }}</text>
        <text class="tag">进入个人中心 (修改信息) ＞</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-title">我的交易</view>
      <view class="menu-board">
        <view class="menu-item" @click="goToOrder('bought')">
          <text class="icon">🛍️</text><text class="text">我买到的</text>
        </view>
        <view class="menu-item" @click="goToOrder('sold')">
          <text class="icon">💰</text><text class="text">我卖出的</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/my/published' })"> 
          <text class="icon">🏷️</text><text class="text">我发布的</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-title">更多服务</view>
      <view class="menu-board grid-layout">
        <view class="menu-item" @click="goToTab('cart')">
          <text class="icon">🛒</text><text class="text">购物车</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/my/history' })">
          <text class="icon">👣</text><text class="text">浏览记录</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/my/follow' })">
          <text class="icon">⭐</text><text class="text">我关注的</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/my/fans' })">
          <text class="icon">💖</text><text class="text">我的粉丝</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/my/reviews' })">
          <text class="icon">💬</text><text class="text">我的评价</text>
        </view>
        <view class="menu-item" @click="goToAddress">
          <text class="icon">📍</text><text class="text">收货地址</text>
        </view>
      </view>
    </view>

    <button class="logout-btn" @click="handleLogout">安全退出账号</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';

const userInfo = ref({
  nickname: '',
  avatar: '',
  bio: ''
});

onShow(() => {
  if (!uni.getStorageSync('token')) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 1000);
  } else {
    fetchUserInfo();
  }
});

const fetchUserInfo = async () => {
  try {
    const res = await request({ url: '/api/user/info', method: 'GET' });
    if (res.data) {
      userInfo.value = res.data;
    }
  } catch (error) {
    console.error('拉取用户信息失败', error);
  }
};
const goToAddress = () => {
  uni.navigateTo({ url: '/pages/my/address/list' });
};
const goToOrder = (type) => { uni.navigateTo({ url: `/pages/order/list?type=${type}` }); };
const goToTab = (name) => { uni.switchTab({ url: `/pages/${name}/${name}` }); };
const handleLogout = () => {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userId');
  uni.showToast({ title: '退出成功', icon: 'none' });
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1000);
};
</script>

<style scoped>
.my-container { min-height: 100vh; background-color: #f6f6f6; padding: 15px; padding-bottom: 80px;}
.header-card { display: flex; align-items: center; background: linear-gradient(135deg, #ff4142, #ff7a7b); padding: 30px 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(255, 65, 66, 0.3); margin-bottom: 20px; transition: transform 0.1s;}
.header-card:active { transform: scale(0.98); }
.avatar { width: 70px; height: 70px; border-radius: 35px; border: 3px solid #fff; margin-right: 20px; background: #eee;}
.user-info { display: flex; flex-direction: column; flex: 1;}
.nickname { font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 4px; }
.bio-text { font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;}
.tag { font-size: 11px; color: #ff4142; background: #fff; padding: 4px 10px; border-radius: 12px; display: inline-block; width: max-content; font-weight: bold;}

.section-card { background: #fff; border-radius: 15px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; padding-left: 10px; border-left: 4px solid #ff4142; line-height: 1;}
.menu-board { display: flex; justify-content: space-around; }
.grid-layout { justify-content: flex-start; gap: 30px; flex-wrap: wrap;} 
.menu-item { display: flex; flex-direction: column; align-items: center; transition: opacity 0.2s; width: 60px; margin-bottom: 10px;} 
.menu-item:active { opacity: 0.6; }
.icon { font-size: 30px; margin-bottom: 8px; }
.text { font-size: 13px; color: #333; white-space: nowrap;}
.logout-btn { background-color: #fff; color: #ff4142; border-radius: 25px; height: 50px; line-height: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #ff4142;}
.logout-btn::after { border: none; }
</style>