<template>
  <view class="order-list-container">
    <view class="tabs">
      <view class="tab" :class="{ active: type === 'bought' }" @click="switchTab('bought')">我买到的</view>
      <view class="tab" :class="{ active: type === 'sold' }" @click="switchTab('sold')">我卖出的</view>
    </view>

    <view v-if="orderList.length === 0" class="empty-tip">空空如也，快去发现好物吧~</view>

    <view class="order-list" v-else>
      <view class="order-card" v-for="order in orderList" :key="order.id" @click="goToDetail(order.id)">
        <view class="order-header">
          <text class="order-no">订单号: {{ order.orderNo || order.id }}</text>
          <text class="status-text" :style="{ color: statusStyle(order.status).color }">{{ statusStyle(order.status).label }}</text>
        </view>

        <view class="order-body">
          <image class="item-img" :src="formatUrl(order.itemImage) || 'https://picsum.photos/100'" mode="aspectFill"></image>
          <view class="item-info">
            <text class="item-title">{{ order.itemTitle || '闲置宝贝' }}</text>
            <text class="item-price">实付款: ￥{{ order.payAmount }}</text>
          </view>
        </view>

        <view class="order-footer">
          <view v-if="order.status === 0 && type === 'bought'" class="btn-cancel" @click.stop="cancelOrder(order)">取消订单</view>
          <view v-if="order.status === 0 && type === 'bought'" class="btn-pay" @click.stop="goToPay(order)">去支付</view>
          <view v-if="order.status === 1" class="btn-review" @click.stop="goToReview(order)">评价此单</view>
          <view v-if="order.status === 2" class="btn-delete" @click.stop="deleteOrder(order)">删除</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl, paymentUrl } from '@/utils/config.js';

const type = ref('bought');
const orderList = ref([]);

onLoad((options) => {
  if (options.type) {
    type.value = options.type;
  }
});

onShow(() => {
  fetchOrderList();
});

const switchTab = (tab) => {
  type.value = tab;
  fetchOrderList();
};

const fetchOrderList = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: `/api/order/${type.value}`, method: 'GET' });
    orderList.value = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    uni.hideLoading();
  }
};

// 订单状态映射：0=待支付，1=已支付，2=已取消
const statusStyle = (status) => {
  const map = {
    0: { label: '待支付', color: '#f59e0b' },
    1: { label: '已支付', color: '#10b981' },
    2: { label: '已取消', color: '#9ca3af' }
  };
  return map[status] || { label: '未知', color: '#999' };
};

// 去支付宝支付
const goToPay = (order) => {
  const orderNo = order.orderNo || order.id;
  // #ifdef H5
  window.location.href = paymentUrl(orderNo);
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(paymentUrl(orderNo));
  // #endif
};

const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return mediaUrl(url);
};

// 买卖家互评，动态计算对方的 ID
const goToReview = (order) => {
  const currentUserId = uni.getStorageSync('userId');
  const buyerId = order.buyerId || order.buyer_id;
  const sellerId = order.sellerId || order.seller_id;
  const itemId = order.itemId || order.item_id;
  const targetId = (currentUserId == buyerId) ? sellerId : buyerId;
  uni.navigateTo({ url: `/pages/order/review?orderId=${order.id}&targetId=${targetId}&itemId=${itemId}` });
};

// 跳转订单详情页
const goToDetail = (orderId) => {
  uni.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
};

// 取消订单
const cancelOrder = async (order) => {
  const res = await uni.showModal({ title: '取消订单', content: '确定取消该订单吗？' });
  if (res.confirm) {
    await request({ url: `/api/order/delete/${order.id}`, method: 'DELETE', loading: '处理中...' });
    fetchOrderList();
  }
};

// 删除订单
const deleteOrder = async (order) => {
  const res = await uni.showModal({ title: '删除订单', content: '确定删除该订单记录吗？' });
  if (res.confirm) {
    await request({ url: `/api/order/delete/${order.id}`, method: 'DELETE', loading: '删除中...' });
    fetchOrderList();
  }
};
</script>

<style scoped>
.order-list-container { min-height: 100vh; background: #f6f6f6; }
.tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10;}
.tab { flex: 1; text-align: center; height: 45px; line-height: 45px; font-size: 15px; color: #666; position: relative;}
.tab.active { color: #ff4142; font-weight: bold; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 35%; right: 35%; height: 3px; background: #ff4142; border-radius: 3px; }

.empty-tip { text-align: center; color: #999; margin-top: 60px; font-size: 14px;}
.order-list { padding: 15px; }
.order-card { background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f9f9f9; padding-bottom: 10px; margin-bottom: 15px;}
.order-no { font-size: 12px; color: #999; }
.status-text { font-size: 13px; font-weight: bold; }

.order-body { display: flex; align-items: center; margin-bottom: 15px;}
.item-img { width: 70px; height: 70px; border-radius: 8px; margin-right: 15px; background: #eee;}
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 70px;}
.item-title { font-size: 15px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;}
.item-price { font-size: 14px; color: #666; font-weight: bold;}

.order-footer { display: flex; justify-content: flex-end; border-top: 1px solid #f9f9f9; padding-top: 12px; gap: 10px;}
.btn-review { border: 1px solid #ff4142; color: #ff4142; font-size: 13px; font-weight: bold; padding: 6px 18px; border-radius: 20px; transition: all 0.2s;}
.btn-review:active { background: #fff0f0; }
.btn-pay { background: #ff4142; color: #fff; font-size: 13px; font-weight: bold; padding: 6px 18px; border-radius: 20px; transition: all 0.2s;}
.btn-pay:active { background: #e53935; }
.btn-cancel { border: 1px solid #ccc; color: #666; font-size: 13px; padding: 6px 18px; border-radius: 20px; }
.btn-delete { border: 1px solid #eee; color: #999; font-size: 13px; padding: 6px 18px; border-radius: 20px; }
</style>
