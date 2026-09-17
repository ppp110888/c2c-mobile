<template>
  <view class="fans-container">
    <view v-if="fansList.length === 0" class="empty-tip">还没有粉丝哦，多发布好物吸引大家吧~</view>
    
    <view class="user-list" v-else>
      <view class="user-card" v-for="user in fansList" :key="user.id" @click="goToProfile(user.id)">
        <image class="avatar" :src="user.avatar || 'https://picsum.photos/100/100?random=3'" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ user.nickname || '神秘玩家' }}</text>
          <text class="bio">{{ user.bio || '这个人很懒，什么都没留下' }}</text>
        </view>
        <view class="btn-view">去TA主页</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';

const fansList = ref([]);

onShow(() => {
  fetchFansList();
});

const fetchFansList = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: '/api/user/fans/list', method: 'GET' });
    fansList.value = res.data || [];
  } catch (e) {
    console.error('获取粉丝列表失败', e);
  } finally {
    uni.hideLoading();
  }
};

// 🚨 架构师联动：点击直接跳转到咱们上一步做好的“TA的主页”
const goToProfile = (userId) => {
  uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};
</script>

<style scoped>
.fans-container { min-height: 100vh; background: #f6f6f6; padding: 15px; }
.empty-tip { text-align: center; color: #999; margin-top: 50px; font-size: 14px;}
.user-card { display: flex; align-items: center; background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.1s;}
.user-card:active { transform: scale(0.98); }
.avatar { width: 50px; height: 50px; border-radius: 25px; margin-right: 15px; background: #eee; border: 1px solid #f0f0f0;}
.info { flex: 1; display: flex; flex-direction: column; }
.name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 6px; }
.bio { font-size: 13px; color: #999; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
.btn-view { border: 1px solid #ff4142; color: #ff4142; font-size: 12px; padding: 5px 12px; border-radius: 15px; transition: all 0.2s; font-weight: bold;}
</style>