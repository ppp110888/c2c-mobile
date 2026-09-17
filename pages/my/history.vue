<template>
  <view class="history-container">
    <view v-if="historyList.length === 0" class="empty-tip">暂无浏览记录，快去逛逛吧~</view>
    
    <view class="item-list" v-else>
      <view class="item-card" v-for="item in historyList" :key="item.id" @click="goToDetail(item.id)">
        <image class="item-img" :src="formatUrl(item.images ? item.images.split(',')[0] : '') || 'https://picsum.photos/200'" mode="aspectFill"></image>
        <view class="item-info">
          <text class="item-title">{{ item.title }}</text>
          <view class="item-bottom-row">
            <text class="item-price">￥{{ item.price }}</text>
            <text class="item-status-sold" v-if="item.status === 2">已卖出</text>
          </view>
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

const historyList = ref([]);

onShow(() => {
  fetchHistory();
});

const fetchHistory = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: '/api/item/history/list', method: 'GET' });
    if (res.data) {
      historyList.value = res.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    uni.hideLoading();
  }
};

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?itemId=${id}` });
};

const formatUrl = (url) => {
  return mediaUrl(url);
};
</script>

<style scoped>
.history-container { min-height: 100vh; background: #f6f6f6; padding: 10px; }
.empty-tip { text-align: center; color: #999; margin-top: 50px; }
.item-card { display: flex; background: #fff; padding: 10px; border-radius: 10px; margin-bottom: 10px; }
.item-img { width: 80px; height: 80px; border-radius: 8px; margin-right: 10px; background: #eee; }
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.item-title { font-size: 15px; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.item-price { font-size: 16px; color: #ff4142; font-weight: bold; }
.item-bottom-row { display: flex; align-items: center; justify-content: space-between; }
.item-status-sold { font-size: 11px; color: #999; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }
</style>
