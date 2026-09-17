<template>
  <view class="order-detail-container">
    <!-- 状态横幅 -->
    <view class="status-banner" :style="{ background: statusStyle(order.status).bg }">
      <text class="status-text">{{ statusStyle(order.status).label }}</text>
    </view>

    <!-- 收货地址 -->
    <view class="card address-card" v-if="order.receiverName">
      <view class="card-title">📍 收货信息</view>
      <view class="address-info">
        <text class="receiver">{{ order.receiverName }}  {{ order.receiverPhone }}</text>
        <text class="addr">{{ order.receiverAddr }}</text>
      </view>
    </view>

    <!-- 商品信息 -->
    <view class="card item-card" @click="goToItem">
      <image class="item-img" :src="formatUrl(order.itemImage)" mode="aspectFill"></image>
      <view class="item-info">
        <text class="item-title">{{ order.itemTitle || '闲置宝贝' }}</text>
        <text class="item-price">￥{{ order.itemPrice || order.payAmount }}</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card info-card">
      <view class="card-title">📋 订单信息</view>
      <view class="info-row"><text class="label">订单编号</text><text class="value">{{ order.orderNo || order.id }}</text></view>
      <view class="info-row"><text class="label">下单时间</text><text class="value">{{ formatDate(order.createTime) }}</text></view>
      <view class="info-row" v-if="order.updateTime"><text class="label">更新时间</text><text class="value">{{ formatDate(order.updateTime) }}</text></view>
      <view class="info-row"><text class="label">实付金额</text><text class="value price">￥{{ order.payAmount }}</text></view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view v-if="order.status === 0 && isBuyer" class="btn-pay" @click="goToPay">去支付</view>
      <view v-if="order.status === 0 && isBuyer" class="btn-cancel" @click="cancelOrder">取消订单</view>
      <view v-if="order.status === 1" class="btn-review" @click="goToReview">评价此单</view>
      <view v-if="order.status === 2 && isBuyer" class="btn-delete" @click="deleteOrder">删除订单</view>
    </view>
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl, paymentUrl } from '@/utils/config.js';

const order = ref({});
const currentUserId = ref('');

const isBuyer = computed(() => String(currentUserId.value) === String(order.value.buyerId));

onLoad((options) => {
  currentUserId.value = uni.getStorageSync('userId') || '';
  if (options.orderId) fetchDetail(options.orderId);
});

const fetchDetail = async (orderId) => {
  try {
    const res = await request({ url: `/api/order/detail/${orderId}`, method: 'GET', loading: '加载中...' });
    order.value = res.data || {};
  } catch (e) { console.error(e); }
};

const statusStyle = (s) => {
  const map = {
    0: { label: '待支付', bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff' },
    1: { label: '已支付', bg: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff' },
    2: { label: '已取消', bg: 'linear-gradient(135deg, #9ca3af, #c4c9d0)', color: '#fff' }
  };
  return map[s] || { label: '未知', bg: '#ccc', color: '#fff' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.replace('T', ' ').substring(0, 16);
  return String(dateStr);
};

const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return mediaUrl(url);
};

const goToItem = () => {
  if (order.value.itemId) uni.navigateTo({ url: `/pages/detail/detail?itemId=${order.value.itemId}` });
};

const goToPay = () => {
  const orderNo = order.value.orderNo || order.value.id;
  // #ifdef H5
  window.location.href = paymentUrl(orderNo);
  // #endif
};

const cancelOrder = async () => {
  const res = await uni.showModal({ title: '取消订单', content: '确定取消该订单吗？商品将重新上架。' });
  if (res.confirm) {
    await request({ url: `/api/order/delete/${order.value.id}`, method: 'DELETE', loading: '处理中...' });
    uni.showToast({ title: '已取消', icon: 'success' });
    fetchDetail(order.value.id);
  }
};

const deleteOrder = async () => {
  const res = await uni.showModal({ title: '删除订单', content: '确定删除该订单记录吗？' });
  if (res.confirm) {
    await request({ url: `/api/order/delete/${order.value.id}`, method: 'DELETE', loading: '删除中...' });
    uni.showToast({ title: '已删除', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  }
};

const goToReview = () => {
  const orderData = order.value;
  const buyerId = orderData.buyerId;
  const sellerId = orderData.sellerId;
  const targetId = (currentUserId.value == buyerId) ? sellerId : buyerId;
  uni.navigateTo({ url: `/pages/order/review?orderId=${orderData.id}&targetId=${targetId}&itemId=${orderData.itemId}` });
};
</script>

<style scoped>
.order-detail-container { min-height: 100vh; background: #f6f6f6; padding-bottom: 80px; }
.status-banner { padding: 25px 20px; text-align: center; }
.status-text { color: #fff; font-size: 20px; font-weight: bold; }

.card { background: #fff; border-radius: 12px; padding: 18px; margin: 12px 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.card-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; }

.address-info { display: flex; flex-direction: column; gap: 4px; }
.receiver { font-size: 15px; font-weight: bold; color: #333; }
.addr { font-size: 13px; color: #666; line-height: 1.5; }

.item-card { display: flex; align-items: center; }
.item-card:active { transform: scale(0.98); }
.item-img { width: 80px; height: 80px; border-radius: 8px; margin-right: 15px; background: #eee; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 80px; }
.item-title { font-size: 15px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.item-price { font-size: 18px; color: #ff4142; font-weight: bold; }

.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.info-row:last-child { border-bottom: none; }
.label { font-size: 13px; color: #999; }
.value { font-size: 14px; color: #333; }
.value.price { color: #ff4142; font-weight: bold; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: flex-end; gap: 12px; padding: 12px 15px; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom); z-index: 99; }
.btn-pay { background: #ff4142; color: #fff; font-size: 14px; font-weight: bold; padding: 10px 28px; border-radius: 22px; }
.btn-cancel { border: 1px solid #ccc; color: #666; font-size: 14px; padding: 10px 20px; border-radius: 22px; }
.btn-review { border: 1px solid #ff4142; color: #ff4142; font-size: 14px; font-weight: bold; padding: 10px 28px; border-radius: 22px; }
.btn-delete { border: 1px solid #ccc; color: #999; font-size: 14px; padding: 10px 20px; border-radius: 22px; }
.safe-bottom { height: env(safe-area-inset-bottom); }
</style>
