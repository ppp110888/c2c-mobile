<template>
  <view class="follow-container">
    <view v-if="userList.length === 0" class="empty-tip">暂无关注的人，去发现有趣的用户吧~</view>
    
    <view class="user-list" v-else>
      <view class="user-card" v-for="user in userList" :key="user.id" @click="goToProfile(user.id)">
        <image class="avatar" :src="user.avatar || 'https://picsum.photos/100/100?random=2'" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ user.nickname || '神秘玩家' }}</text>
          <text class="bio">{{ user.bio || '这个人很懒，什么都没留下' }}</text>
        </view>
        <view class="btn-cancel" @click.stop="cancelFollow(user.id)">取消关注</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';

const userList = ref([]);

// 每次进入页面都重新拉取，保证数据是最新的
onShow(() => {
  fetchFollowList();
});

const fetchFollowList = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: '/api/user/follow/list', method: 'GET' });
    userList.value = res.data || [];
  } catch (e) {
    console.error('获取关注列表失败', e);
  } finally {
    uni.hideLoading();
  }
};

const goToProfile = (userId) => {
  if (userId) uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};

const cancelFollow = (targetId) => {
  // 🚨 架构师细节：取消关注前给个二次确认弹窗
  uni.showModal({
    title: '提示',
    content: '确定要取消关注这个有趣的人吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' });
        try {
          await request({ url: `/api/user/follow/toggle?targetId=${targetId}`, method: 'POST' });
          uni.hideLoading();
          uni.showToast({ title: '已取消关注', icon: 'none' });
          // 取消成功后，重新拉取最新列表刷新页面
          fetchFollowList(); 
        } catch(e) {
          uni.hideLoading();
        }
      }
    }
  });
};
</script>

<style scoped>
.follow-container { min-height: 100vh; background: #f6f6f6; padding: 15px; }
.empty-tip { text-align: center; color: #999; margin-top: 50px; font-size: 14px;}
.user-card { display: flex; align-items: center; background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.avatar { width: 50px; height: 50px; border-radius: 25px; margin-right: 15px; background: #eee; border: 1px solid #f0f0f0;}
.info { flex: 1; display: flex; flex-direction: column; }
.name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 6px; }
.bio { font-size: 13px; color: #999; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
.btn-cancel { border: 1px solid #ddd; color: #666; font-size: 12px; padding: 5px 12px; border-radius: 15px; transition: all 0.2s;}
.btn-cancel:active { background: #f9f9f9; }
</style>