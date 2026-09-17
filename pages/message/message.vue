<template>
  <view class="message-container">
    <view class="header-title">消息中心</view>
    <view class="header-subtitle">长按可删除聊天记录</view>
    
    <view v-if="conversationList.length === 0" class="empty-tip">
      <text class="icon">📭</text>
      <text>暂无消息，快去和卖家聊聊吧~</text>
    </view>

    <view class="msg-list" v-else>
      <view class="msg-item" 
            v-for="item in conversationList" 
            :key="item.toUserId" 
            @click="goToChat(item)"
            @longpress="handleDelete(item)">
            
        <image class="avatar" :src="formatUrl(item.avatar) || 'https://picsum.photos/100/100?random=1'" mode="aspectFill" @click.stop="goToProfile(item.toUserId)"></image>
        
        <view class="msg-info">
          <view class="info-top">
            <text class="nickname">{{ item.nickname || '神秘用户' }}</text>
            <text class="time">{{ formatDate(item.lastTime) }}</text>
          </view>
          <text class="last-msg">{{ item.lastMsg }}</text>
        </view>
        
        <view class="badge" v-if="item.unreadCount > 0">{{ item.unreadCount }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl } from '@/utils/config.js';

const conversationList = ref([]);

onShow(() => {
  if (uni.getStorageSync('token')) {
    fetchConversations();
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' });
  }
});

onPullDownRefresh(async () => {
  await fetchConversations();
  uni.stopPullDownRefresh();
});

const fetchConversations = async () => {
  try {
    const res = await request({ url: '/api/message/session/list', method: 'GET' });
    conversationList.value = res.data || [];
  } catch (error) {
    console.error("获取会话列表失败", error);
  }
};

// ==========================================
// 🚨 新增：长按删除的核心逻辑
// ==========================================
const handleDelete = (item) => {
  // 1. 弹出大厂级的原生二次确认框
  uni.showModal({
    title: '删除聊天',
    content: `确定要清空与「${item.nickname || '该用户'}」的所有聊天记录吗？`,
    confirmColor: '#ff4142',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          // 2. 调用后端刚刚写好的删除接口
          await request({ 
            url: `/api/message/session/delete?targetId=${item.toUserId}`, 
            method: 'DELETE' 
          });
          uni.hideLoading();
          uni.showToast({ title: '已删除', icon: 'success' });
          
          // 3. 重新拉取最新的消息列表，让被删掉的框彻底消失！
          fetchConversations();
        } catch (e) {
          uni.hideLoading();
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const formatUrl = (url) => {
  return mediaUrl(url);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.replace('T', ' ').substring(11, 16);
  return dateStr;
};

const goToChat = (item) => {
  uni.navigateTo({ url: `/pages/message/chat?toUserId=${item.toUserId}` });
};

const goToProfile = (userId) => {
  if (userId) uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};
</script>

<style scoped>
.message-container { min-height: 100vh; background: #f6f6f6; }
.header-title { font-size: 20px; font-weight: bold; padding: 20px 15px 4px; background: #fff; position: sticky; top: 0; z-index: 10;}
/* 新增一个温馨的提示语 */
.header-subtitle { font-size: 11px; color: #999; padding: 0 15px 10px; background: #fff; position: sticky; top: 48px; z-index: 10; border-bottom: 1px solid #f0f0f0;}

.empty-tip { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; color: #999; font-size: 14px;}
.empty-tip .icon { font-size: 50px; margin-bottom: 10px; }
.msg-item { display: flex; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #f9f9f9; transition: background 0.2s; position: relative;}
.msg-item:active { background: #f0f0f0; }
.avatar { width: 50px; height: 50px; border-radius: 25px; margin-right: 15px; background: #eee; flex-shrink: 0;}
.msg-info { flex: 1; display: flex; flex-direction: column; justify-content: space-around; height: 50px;}
.info-top { display: flex; justify-content: space-between; align-items: center; }
.nickname { font-size: 16px; font-weight: bold; color: #333; }
.time { font-size: 12px; color: #aaa; }
.last-msg { font-size: 13px; color: #888; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; margin-top: 4px; padding-right: 20px;}
.badge { position: absolute; right: 15px; bottom: 15px; background: #ff4142; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: bold;}
</style>
