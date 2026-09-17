<template>
  <view class="reviews-container">
    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'received' }" @click="tab = 'received'">收到的评价</view>
      <view class="tab" :class="{ active: tab === 'given' }" @click="tab = 'given'">发出的评价</view>
    </view>

    <view v-if="tab === 'received'">
      <view v-if="receivedList.length === 0" class="empty-tip">暂无收到的评价</view>
      <view class="review-list" v-else>
        <view class="review-card" v-for="review in receivedList" :key="review.id">
          <view class="review-header">
            <image class="reviewer-avatar" :src="formatUrl(review.reviewer_avatar) || 'https://picsum.photos/100/100?random=1'" mode="aspectFill" @click="goToProfile(review.reviewer_id)"></image>
            <view class="reviewer-info" @click="goToProfile(review.reviewer_id)">
              <text class="reviewer-name">{{ review.reviewer_nickname || '神秘用户' }}</text>
              <text class="review-time">{{ formatDate(review.create_time) }}</text>
            </view>
            <view class="stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</text>
            </view>
          </view>
          <view class="review-content">{{ review.content }}</view>
        </view>
      </view>
    </view>

    <view v-if="tab === 'given'">
      <view v-if="givenList.length === 0" class="empty-tip">暂无发出的评价</view>
      <view class="review-list" v-else>
        <view class="review-card" v-for="review in givenList" :key="review.id">
          <view class="review-header">
            <image class="reviewer-avatar" :src="formatUrl(review.reviewer_avatar) || 'https://picsum.photos/100/100?random=1'" mode="aspectFill" @click="goToProfile(review.target_id)"></image>
            <view class="reviewer-info" @click="goToProfile(review.target_id)">
              <text class="reviewer-name">{{ review.reviewer_nickname || '神秘用户' }}</text>
              <text class="review-time">{{ formatDate(review.create_time) }}</text>
            </view>
            <view class="stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</text>
            </view>
          </view>
          <view class="review-content">{{ review.content }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl } from '@/utils/config.js';

const tab = ref('received');
const receivedList = ref([]);
const givenList = ref([]);

onShow(() => {
  fetchMyReviews();
});

const fetchMyReviews = async () => {
  const currentUserId = uni.getStorageSync('userId');
  if (!currentUserId) return;

  uni.showLoading({ title: '加载评价中...' });
  try {
    const res = await request({ url: '/api/order/review/my', method: 'GET' });
    receivedList.value = res.data?.received || [];
    givenList.value = res.data?.given || [];
  } catch (e) {
    console.error('获取评价失败', e);
  } finally {
    uni.hideLoading();
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.replace('T', ' ').substring(0, 16);
  return dateStr;
};

const formatUrl = (url) => {
  return mediaUrl(url);
};

const goToProfile = (userId) => {
  if (userId) uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};
</script>

<style scoped>
.reviews-container { min-height: 100vh; background: #f6f6f6; }
.tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10;}
.tab { flex: 1; text-align: center; height: 45px; line-height: 45px; font-size: 15px; color: #666; }
.tab.active { color: #ff4142; font-weight: bold; position: relative; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 35%; right: 35%; height: 3px; background: #ff4142; border-radius: 3px; }
.review-list { padding: 15px; }
.empty-tip { text-align: center; color: #999; margin-top: 60px; font-size: 14px;}
.review-card { background: #fff; border-radius: 15px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.review-header { display: flex; align-items: center; margin-bottom: 15px; }
.reviewer-avatar { width: 40px; height: 40px; border-radius: 20px; margin-right: 12px; background: #eee;}
.reviewer-info { flex: 1; display: flex; flex-direction: column; }
.reviewer-name { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px; }
.review-time { font-size: 11px; color: #999; }
.stars { display: flex; gap: 2px; }
.star { font-size: 16px; color: #eee; }
.star.active { color: #ffca28; }
.review-content { font-size: 14px; color: #333; line-height: 1.6; background: #f9f9f9; padding: 12px; border-radius: 10px; }
</style>
