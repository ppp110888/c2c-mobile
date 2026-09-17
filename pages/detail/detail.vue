<template>
  <view class="detail-container">
    <swiper class="banner-swiper" circular :indicator-dots="parsedImages.length > 1" indicator-active-color="#ff4142" autoplay :interval="3000">
      <swiper-item v-for="(imgUrl, index) in parsedImages" :key="index">
        <image class="banner-img" :src="imgUrl" mode="aspectFit" @click="previewImage(index)"></image>
      </swiper-item>
    </swiper>

    <view class="info-card">
      <view class="price-box">
        <text class="price-symbol">￥</text>
        <text class="current-price">{{ item.price }}</text>
      </view>
      <view class="title-box">
        <text class="item-title">{{ item.title }}</text>
      </view>
      <text class="item-content">{{ item.content || '这个卖家很懒，什么都没写~' }}</text>
    </view>

    <view class="seller-card" v-if="sellerInfo" @click="goToProfile(sellerInfo.id)">
      <image class="seller-avatar" :src="sellerInfo.avatar || 'https://picsum.photos/100/100?random=1'" mode="aspectFill"></image>
      <view class="seller-info">
        <text class="seller-name">{{ sellerInfo.nickname || '神秘卖家' }}</text>
        <text class="seller-tag">已实名认证</text>
      </view>
      <view :class="['follow-btn', isFollowing ? 'followed' : '']" @click.stop="toggleFollow" v-if="!isMyItem">
        {{ isFollowing ? '已关注' : '+ 关注' }}
      </view>
    </view>

    <!-- 地址选择弹出层 -->
    <view class="address-picker-mask" v-if="showAddressPicker" @click="showAddressPicker = false"></view>
    <view class="address-picker" v-if="showAddressPicker">
      <view class="picker-header">
        <text class="picker-title">选择收货地址</text>
        <view class="picker-close" @click="showAddressPicker = false">✕</view>
      </view>
      <view class="picker-body">
        <view class="address-item" v-for="addr in addressList" :key="addr.id"
              :class="{ selected: selectedAddressId === addr.id }"
              @click="selectAddress(addr)">
          <view class="addr-check">
            <view class="radio" :class="{ checked: selectedAddressId === addr.id }">
              <text v-if="selectedAddressId === addr.id">✓</text>
            </view>
          </view>
          <view class="addr-info">
            <view class="addr-top">
              <text class="addr-receiver">{{ addr.receiver }}</text>
              <text class="addr-phone">{{ addr.phone }}</text>
              <view class="addr-tag" v-if="addr.isDefault == 1">默认</view>
            </view>
            <text class="addr-detail">{{ addr.region || '' }} {{ addr.detail || '' }}</text>
          </view>
        </view>
        <view class="addr-add-btn" @click="goToAddAddress">
          <text>+ 添加新地址</text>
        </view>
      </view>
      <view class="picker-footer">
        <button class="btn-confirm-addr" @click="confirmWithAddress">确认下单</button>
      </view>
    </view>

    <view class="bottom-action-bar">
      <view class="action-icon" @click="goHome"><text class="icon">🏠</text><text class="icon-text">首页</text></view>
      <view class="action-icon" @click="goToChat"><text class="icon">💬</text><text class="icon-text">聊一聊</text></view>
      <view class="action-icon" @click="goToCart"><text class="icon">🛒</text><text class="icon-text">购物车</text></view>
      
      <view class="action-btn-group">
        <button class="btn-buy disabled" v-if="isMyItem">这是您发布的商品</button>
        <template v-else>
          <button class="btn-cart" @click="handleAddToCart">加入购物车</button>
          <button class="btn-buy" @click="handleBuy">立即购买</button>
        </template>
      </view>
    </view>
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl, paymentUrl } from '@/utils/config.js';

const item = ref({});
const sellerInfo = ref({});
const isFollowing = ref(false);

// 地址选择相关
const showAddressPicker = ref(false);
const addressList = ref([]);
const selectedAddressId = ref(null);

const parsedImages = computed(() => {
  if (!item.value.images) return ['https://picsum.photos/400/400?random=99']; 
  return item.value.images.split(',').map(url => {
    return mediaUrl(url);
  });
});

const isMyItem = computed(() => {
  const currentUserId = uni.getStorageSync('userId');
  return currentUserId && item.value.sellerId && String(currentUserId) === String(item.value.sellerId);
});

onLoad((options) => {
  if (options.itemId) {
    fetchDetail(options.itemId);
    recordHistory(options.itemId); 
  }
});

const fetchDetail = async (id) => {
  try {
    const res = await request({ url: `/api/item/detail?itemId=${id}`, method: 'GET', loading: '加载中...' });
    item.value = res.data.item || {};
    sellerInfo.value = res.data.sellerInfo || null;
    if (item.value.sellerId) {
      checkFollowStatus(item.value.sellerId);
    }
  } catch (error) {
    console.error("获取详情失败", error);
  }
};

const checkFollowStatus = async (sellerId) => {
  if (!uni.getStorageSync('token') || isMyItem.value) return;
  try {
    const res = await request({ url: `/api/user/follow/check?targetId=${sellerId}`, method: 'GET' });
    isFollowing.value = res.data;
  } catch(e) {}
};

const toggleFollow = async () => {
  if (!uni.getStorageSync('token')) return uni.showToast({ title: '请先登录', icon: 'none' });
  try {
    const res = await request({ url: `/api/user/follow/toggle?targetId=${item.value.sellerId}`, method: 'POST', loading: '处理中...' });
    uni.showToast({ title: res.data, icon: 'none' });
    isFollowing.value = !isFollowing.value;
  } catch (e) {}
};

const recordHistory = async (id) => {
  if (!uni.getStorageSync('token')) return; 
  try { await request({ url: `/api/item/history/add?itemId=${id}`, method: 'POST' }); } catch (e) {}
};

const previewImage = (current) => { uni.previewImage({ current: current, urls: parsedImages.value }); };
const goHome = () => { uni.switchTab({ url: '/pages/index/index' }); };
const goToCart = () => { uni.switchTab({ url: '/pages/cart/cart' }); };
const goToChat = () => {
  if (!uni.getStorageSync('token')) return uni.showToast({ title: '请先登录', icon: 'none' });
  uni.navigateTo({ url: `/pages/message/chat?toUserId=${item.value.sellerId}&itemId=${item.value.id}` });
};

// 🚨 新增：跳转到 TA 的主页
const goToProfile = (userId) => {
  if(!userId) return;
  uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};

const handleAddToCart = async () => {
  if (!uni.getStorageSync('token')) return uni.showToast({ title: '请先登录', icon: 'none' });
  try {
    const cartItemData = { itemId: item.value.id, title: item.value.title, price: item.value.price, image: parsedImages.value[0], sellerId: item.value.sellerId };
    const res = await request({ url: '/api/order/cart/add', method: 'POST', data: cartItemData, loading: '加入中...' });
    uni.showToast({ title: res.data || '加入成功', icon: 'success' });
  } catch (error) {}
};

const handleBuy = async () => {
  if (!uni.getStorageSync('token')) return uni.showToast({ title: '请先登录', icon: 'none' });

  // 1. 获取收货地址列表
  try {
    const addrRes = await request({ url: '/api/user/address/list', method: 'GET', loading: '获取地址中...' });
    const addrList = addrRes.data || [];

    if (addrList.length === 0) {
      const res = await uni.showModal({ title: '提示', content: '您还没有收货地址，先去添加一个吧！', confirmText: '去添加' });
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/my/address/edit' });
      }
      return;
    }

    // 2. 显示地址选择弹窗
    addressList.value = addrList;
    const defaultAddr = addrList.find(a => a.isDefault == 1) || addrList[0];
    selectedAddressId.value = defaultAddr.id;
    showAddressPicker.value = true;
  } catch (e) {
    console.error('获取地址失败', e);
  }
};

const selectAddress = (addr) => {
  selectedAddressId.value = addr.id;
};

const goToAddAddress = () => {
  showAddressPicker.value = false;
  uni.navigateTo({ url: '/pages/my/address/edit' });
};

const confirmWithAddress = async () => {
  if (!selectedAddressId.value) {
    return uni.showToast({ title: '请选择收货地址', icon: 'none' });
  }

  showAddressPicker.value = false;

  try {
    const res = await request({
      url: '/api/order/create',
      method: 'POST',
      data: { itemId: item.value.id, addressId: selectedAddressId.value },
      loading: '极速生成订单...'
    });
    const orderNo = res.data;
    if (orderNo) {
      setTimeout(() => {
        // #ifdef H5
        window.location.href = paymentUrl(orderNo);
        // #endif
        // #ifdef APP-PLUS
        plus.runtime.openURL(paymentUrl(orderNo));
        // #endif
      }, 300);
    } else {
      uni.showToast({ title: '下单成功，但未获取到订单号', icon: 'none' });
      setTimeout(() => { uni.navigateTo({ url: '/pages/order/list?type=bought' }); }, 1000);
    }
  } catch (error) {}
};
</script>

<style scoped>
.detail-container { min-height: 100vh; background-color: #f6f6f6; padding-bottom: 80px; }
.banner-swiper { width: 100%; height: 380px; background-color: #1a1a1a; }
.banner-img { width: 100%; height: 100%; }
.info-card { background: #fff; padding: 20px; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); margin-bottom: 12px; }
.price-box { display: flex; align-items: baseline; margin-bottom: 15px; }
.price-symbol { font-size: 16px; color: #ff4142; font-weight: bold; }
.current-price { font-size: 32px; color: #ff4142; font-weight: bold; margin-right: 10px; }
.title-box { display: flex; align-items: flex-start; margin-bottom: 15px; }
.item-title { font-size: 18px; font-weight: bold; color: #333; line-height: 1.4; }
.item-content { font-size: 15px; color: #666; line-height: 1.6; display: block; margin-bottom: 20px; }
.seller-card { background: #fff; padding: 15px 20px; border-radius: 20px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.02); margin-bottom: 12px; transition: transform 0.1s;}
.seller-card:active { transform: scale(0.98); }
.seller-avatar { width: 50px; height: 50px; border-radius: 25px; margin-right: 15px; background: #eee; }
.seller-info { flex: 1; display: flex; flex-direction: column; }
.seller-name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
.seller-tag { font-size: 12px; color: #ff9900; background: #fff8e6; padding: 2px 8px; border-radius: 10px; width: max-content; }
.follow-btn { border: 1px solid #ff4142; color: #ff4142; padding: 4px 14px; border-radius: 15px; font-size: 13px; font-weight: bold; transition: all 0.2s;}
.follow-btn.followed { border: 1px solid #ccc; color: #999; background: #f9f9f9; }
.bottom-action-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: #fff; display: flex; align-items: center; padding: 0 15px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom); z-index: 99; }
.action-icon { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 50px; margin-right: 10px; }
.icon { font-size: 20px; margin-bottom: 2px; }
.icon-text { font-size: 10px; color: #666; }
.action-btn-group { flex: 1; display: flex; justify-content: flex-end; align-items: center;}
.btn-cart { background: linear-gradient(90deg, #ffd000, #ff9900); color: #fff; font-size: 14px; font-weight: bold; height: 40px; line-height: 40px; border-radius: 20px 0 0 20px; width: 50%; margin: 0; text-align: center;}
.btn-buy { background: linear-gradient(90deg, #ff7a7b, #ff4142); color: #fff; font-size: 14px; font-weight: bold; height: 40px; line-height: 40px; border-radius: 0 20px 20px 0; width: 50%; margin: 0; text-align: center;}
.btn-buy.disabled { background: #cccccc; box-shadow: none; color: #fff; border-radius: 20px; width: 100%;}
.btn-cart::after, .btn-buy::after { border: none; }
.safe-area-bottom { height: env(safe-area-inset-bottom); }

/* 地址选择弹出层 */
.address-picker-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 200; animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.address-picker { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 20px 20px 0 0; z-index: 201; max-height: 60vh; display: flex; flex-direction: column; animation: slideUp 0.25s; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.picker-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f0f0f0; }
.picker-title { font-size: 17px; font-weight: bold; color: #333; }
.picker-close { font-size: 18px; color: #999; padding: 5px; }
.picker-body { flex: 1; overflow-y: auto; padding: 10px 0; }
.address-item { display: flex; align-items: flex-start; padding: 15px 20px; border-bottom: 1px solid #f9f9f9; transition: background 0.15s; }
.address-item:active { background: #f9f9f9; }
.address-item.selected { background: #fff8f8; }
.addr-check { margin-right: 12px; padding-top: 2px; }
.radio { width: 20px; height: 20px; border-radius: 10px; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; transition: all 0.2s; }
.radio.checked { background: #ff4142; border-color: #ff4142; }
.addr-info { flex: 1; }
.addr-top { display: flex; align-items: center; margin-bottom: 6px; }
.addr-receiver { font-size: 15px; font-weight: bold; color: #333; margin-right: 12px; }
.addr-phone { font-size: 13px; color: #666; margin-right: 8px; }
.addr-tag { font-size: 10px; color: #ff4142; background: #fff0f0; padding: 1px 6px; border-radius: 6px; }
.addr-detail { font-size: 13px; color: #888; display: block; }
.addr-add-btn { padding: 15px 20px; text-align: center; color: #ff4142; font-size: 14px; font-weight: bold; border-bottom: 1px solid #f0f0f0; }
.picker-footer { padding: 12px 20px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid #f0f0f0; }
.btn-confirm-addr { background: linear-gradient(90deg, #ff7a7b, #ff4142); color: #fff; font-size: 16px; font-weight: bold; height: 44px; line-height: 44px; border-radius: 22px; width: 100%; margin: 0; text-align: center; border: none; }
.btn-confirm-addr::after { border: none; }
</style>
