<template>
  <view class="profile-container">
    <view class="header-card">
      <image class="avatar" :src="targetUserInfo.avatar || 'https://picsum.photos/200/200?random=10'" mode="aspectFill"></image>
      <text class="nickname">{{ targetUserInfo.nickname || '神秘玩家' }}</text>
      <text class="bio">{{ targetUserInfo.bio || '这个人很懒，什么都没留下~' }}</text>
    </view>

    <view class="tabs">
      <view class="tab" :class="{ active: currentTab === 'items' }" @click="currentTab = 'items'">TA发布的</view>
      <view class="tab" :class="{ active: currentTab === 'reviews' }" @click="currentTab = 'reviews'">TA的评价</view>
    </view>

    <view v-show="currentTab === 'items'" class="tab-content">
      <view v-if="itemList.length === 0" class="empty-tip">TA还没有发布过任何闲置~</view>
      <view class="item-list" v-else>
        <view class="item-card" v-for="item in itemList" :key="item.id" @click="goToDetail(item.id)">
          <view class="profile-img-wrap">
            <image class="item-img" :src="formatUrl(item.images ? item.images.split(',')[0] : '') || 'https://picsum.photos/200'" mode="aspectFill"></image>
            <view class="sold-badge" v-if="item.status === 2">已卖出</view>
          </view>
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-price-row">
              <text class="item-price">￥{{ item.price }}</text>
              <text class="item-status-tag" :class="{ sold: item.status === 2 }">{{ item.status === 2 ? '已卖出' : '出售中' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-show="currentTab === 'reviews'" class="tab-content">
      <view v-if="reviewList.length === 0" class="empty-tip">TA暂时还没有收到评价哦~</view>
      <view class="review-list" v-else>
        <view class="review-card" v-for="review in reviewList" :key="review.id">
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
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl } from '@/utils/config.js';

const targetUserId = ref('');
const targetUserInfo = ref({});
const currentTab = ref('items');
const itemList = ref([]);
const reviewList = ref([]);

onLoad((options) => {
  if (options.userId) {
    targetUserId.value = options.userId;
    fetchPublicUserInfo(options.userId);
    fetchPublicItems(options.userId);
    fetchPublicReviews(options.userId);
  }
});

const fetchPublicUserInfo = async (id) => {
  try {
    const res = await request({ url: `/api/user/public/info?userId=${id}`, method: 'GET' });
    targetUserInfo.value = res.data || {};
  } catch (e) { console.error(e); }
};

const fetchPublicItems = async (id) => {
  try {
    const res = await request({ url: `/api/item/public/list?userId=${id}`, method: 'GET' });
    itemList.value = res.data || [];
  } catch (e) {}
};

const fetchPublicReviews = async (id) => {
  try {
    const res = await request({ url: `/api/order/review/list?targetId=${id}&enrich=true`, method: 'GET' });
    reviewList.value = res.data || [];
  } catch (e) {}
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.replace('T', ' ').substring(0, 16);
  return dateStr;
};

const formatUrl = (url) => {
  return mediaUrl(url);
};

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?itemId=${id}` });
};

const goToProfile = (userId) => {
  if (userId) uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};
</script>

<style scoped>
.profile-container { min-height: 100vh; background: #f6f6f6; }
.header-card { background: #fff; padding: 40px 20px 30px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); margin-bottom: 10px;}
.avatar { width: 90px; height: 90px; border-radius: 45px; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 15px; background: #eee;}
.nickname { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 10px; }
.bio { font-size: 14px; color: #666; text-align: center; padding: 0 20px; line-height: 1.5; }

.tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10;}
.tab { flex: 1; text-align: center; height: 45px; line-height: 45px; font-size: 15px; color: #666; position: relative; transition: all 0.2s;}
.tab.active { color: #ff4142; font-weight: bold; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 35%; right: 35%; height: 3px; background: #ff4142; border-radius: 3px; }

.tab-content { padding: 15px; }
.empty-tip { text-align: center; color: #999; margin-top: 50px; font-size: 14px;}

/* 商品列表样式 */
.item-card { display: flex; background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.profile-img-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; margin-right: 15px; }
.item-img { width: 80px; height: 80px; border-radius: 8px; background: #eee;}
.sold-badge { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; }
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 4px 0;}
.item-title { font-size: 15px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4;}
.item-price-row { display: flex; align-items: center; justify-content: space-between; }
.item-price { font-size: 18px; color: #ff4142; font-weight: bold; }
.item-status-tag { font-size: 11px; color: #ff9900; background: #fff8e6; padding: 2px 8px; border-radius: 10px; }
.item-status-tag.sold { color: #999; background: #f0f0f0; }

/* 评价列表样式 */
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
