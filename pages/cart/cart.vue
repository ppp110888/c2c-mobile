<template>
  <view class="cart-container">
    <view v-if="cartList.length === 0" class="empty-tip">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车空空如也，快去挑点宝贝吧</text>
      <button class="go-shop-btn" @click="goToHome">去逛逛</button>
    </view>
    
    <view class="cart-list" v-else>
      <view class="cart-item" v-for="item in cartList" :key="item.itemId">
        
        <view class="checkbox-wrap" @click.stop="isItemAvailable(item) && toggleCheck(item)">
          <view class="checkbox" :class="{ checked: item.checked, disabled: !isItemAvailable(item) }" v-if="isItemAvailable(item)">
            <text class="check-icon" v-if="item.checked">✓</text>
          </view>
          <view class="checkbox disabled" v-else>
            <text class="sold-mark">—</text>
          </view>
        </view>

        <view class="img-wrap">
          <image class="item-img" :src="formatUrl(item.image) || 'https://picsum.photos/200'" mode="aspectFill" @click="isItemAvailable(item) && goToDetail(item.itemId)"></image>
          <view class="sold-overlay" v-if="item.itemStatus === 2">已售出</view>
          <view class="sold-overlay delisted" v-if="item.itemStatus === -1">已下架</view>
        </view>
        <view class="item-info" @click="isItemAvailable(item) && goToDetail(item.itemId)">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-price">￥{{ item.price }}</text>
        </view>
        <view class="delete-btn" @click.stop="deleteItem(item.itemId)">删除</view>
      </view>

      <view class="bottom-bar">
        <view class="select-all-wrap" @click="toggleSelectAll">
          <view class="checkbox" :class="{ checked: isAllSelected }">
            <text class="check-icon" v-if="isAllSelected">✓</text>
          </view>
          <text class="select-all-text">全选</text>
        </view>

        <view class="right-action">
          <view class="total-box">
            <text class="total-label">合计：</text>
            <text class="total-price">￥{{ totalPrice }}</text>
          </view>
          <button class="checkout-btn" :class="{ disabled: selectedCount === 0 }" @click="handleCheckout">
            结算 ({{ selectedCount }})
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';
import { mediaUrl, paymentUrl } from '@/utils/config.js';

const cartList = ref([]);

onShow(() => {
  if (uni.getStorageSync('token')) {
    fetchCartList();
  }
});

const fetchCartList = async () => {
  try {
    const res = await request({ url: '/api/order/cart/list', method: 'GET', loading: '加载中...' });
    if (res.data) {
      cartList.value = res.data.map(item => ({
        ...item,
        checked: item.itemStatus !== 2 && item.itemStatus !== -1 // 已售出/已下架默认不选
      }));
    } else {
      cartList.value = [];
    }
  } catch (e) {
    console.error('获取购物车失败', e);
  }
};

// 🚨 切换单个商品的选中状态
const toggleCheck = (item) => {
  item.checked = !item.checked;
};

// 🚨 判断是否已经全选（只看可购买商品）
const isAllSelected = computed(() => {
  const available = cartList.value.filter(isItemAvailable);
  return available.length > 0 && available.every(item => item.checked);
});

// 🚨 点击全选/取消全选（只看可购买商品）
const toggleSelectAll = () => {
  const newState = !isAllSelected.value;
  cartList.value.forEach(item => {
    if (isItemAvailable(item)) {
      item.checked = newState;
    }
  });
};

// 🚨 判断商品是否可购买（排除已售出和已下架）
const isItemAvailable = (item) => {
  return item.itemStatus !== 2 && item.itemStatus !== -1;
};

// 🚨 获取当前选中的商品列表
const selectedItems = computed(() => {
  return cartList.value.filter(item => item.checked && isItemAvailable(item));
});

// 🚨 选中的商品总数
const selectedCount = computed(() => {
  return selectedItems.value.length;
});

// 🚨 只计算选中的商品总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + parseFloat(item.price || 0);
  }, 0).toFixed(2);
});

const deleteItem = (itemId) => {
  uni.showModal({
    title: '提示',
    content: '确定要将该商品移出购物车吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({ url: `/api/order/cart/delete/${itemId}`, method: 'DELETE', loading: '删除中...' });
          uni.showToast({ title: '已成功移除', icon: 'success' });
          fetchCartList();
        } catch (error) {}
      }
    }
  });
};

const formatUrl = (url) => {
  return mediaUrl(url);
};

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?itemId=${id}` });
};

const goToHome = () => {
  uni.switchTab({ url: '/pages/index/index' });
};

const handleCheckout = async () => {
  if (selectedCount.value === 0) return uni.showToast({ title: '请先选择要购买的商品', icon: 'none' });

  // 1. 选择收货地址
  let addressId = null;
  try {
    const addrRes = await request({ url: '/api/user/address/list', method: 'GET', loading: '获取地址中...' });
    const addrList = addrRes.data || [];
    if (addrList.length === 0) {
      const res = await uni.showModal({ title: '提示', content: '您还没有收货地址，先去添加一个吧！', confirmText: '去添加' });
      if (res.confirm) uni.navigateTo({ url: '/pages/my/address/edit' });
      return;
    }
    const defaultAddr = addrList.find(a => a.isDefault == 1) || addrList[0];
    addressId = defaultAddr.id;
    uni.showToast({ title: `已选择: ${defaultAddr.receiver}`, icon: 'none', duration: 1200 });
  } catch (e) { console.error('获取地址失败', e); }

  try {
    const orderNos = [];

    for (const item of selectedItems.value) {
      const res = await request({
        url: '/api/order/create',
        method: 'POST',
        data: { itemId: item.itemId, addressId: addressId },
        loading: '极速结算中...'
      });
      if (res.data) orderNos.push(res.data);
      await request({ url: `/api/order/cart/delete/${item.itemId}`, method: 'DELETE' });
    }

    uni.showToast({ title: '结算成功！', icon: 'success' });
    if (orderNos.length > 0) {
      setTimeout(() => {
        // #ifdef H5
        window.location.href = paymentUrl(orderNos[0]);
        // #endif
        // #ifdef APP-PLUS
        plus.runtime.openURL(paymentUrl(orderNos[0]));
        // #endif
      }, 1000);
    } else {
      setTimeout(() => { uni.navigateTo({ url: '/pages/order/list?type=bought' }); }, 1000);
    }
  } catch (error) {
    uni.showToast({ title: '结算出现异常', icon: 'none' });
  }
};
</script>

<style scoped>
.cart-container { min-height: 100vh; background: #f6f6f6; padding: 15px; padding-bottom: 80px; box-sizing: border-box;}
.empty-tip { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 120px; }
.empty-icon { font-size: 60px; margin-bottom: 15px; }
.empty-text { font-size: 15px; color: #999; margin-bottom: 30px; }
.go-shop-btn { border: 1px solid #ff4142; color: #ff4142; background: transparent; border-radius: 20px; font-size: 14px; padding: 0 30px; height: 36px; line-height: 36px; }
.go-shop-btn::after { border: none; }

.cart-item { display: flex; align-items: center; background: #fff; padding: 15px 15px 15px 10px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

/* 🚨 Checkbox 样式 */
.checkbox-wrap { padding: 5px 10px; }
.checkbox { width: 20px; height: 20px; border-radius: 10px; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; transition: all 0.2s;}
.checkbox.checked { background-color: #ff4142; border-color: #ff4142; }
.check-icon { color: #fff; font-size: 14px; font-weight: bold; }

.item-img { width: 80px; height: 80px; border-radius: 8px; background: #eee; flex-shrink: 0;}
.img-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; margin-right: 15px; }
.sold-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: bold; border-radius: 8px; }
.sold-overlay.delisted { background: rgba(0,0,0,0.6); color: #ccc; font-size: 12px; }
.checkbox.disabled { background: #eee; border-color: #ddd; }
.sold-mark { color: #ccc; font-size: 12px; }
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 80px; padding: 2px 0;}
.item-title { font-size: 15px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4;}
.item-price { font-size: 18px; color: #ff4142; font-weight: bold; }
.delete-btn { font-size: 13px; color: #ff4142; padding: 10px; font-weight: 500;}

.bottom-bar { position: fixed; bottom: var(--window-bottom); left: 0; right: 0; height: 60px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 99; padding-bottom: env(safe-area-inset-bottom);}

.select-all-wrap { display: flex; align-items: center; padding: 10px; }
.select-all-text { font-size: 14px; color: #333; margin-left: 8px; }

.right-action { display: flex; align-items: center; }
.total-box { display: flex; align-items: baseline; margin-right: 15px;}
.total-label { font-size: 14px; color: #333; }
.total-price { font-size: 20px; color: #ff4142; font-weight: bold; }
.checkout-btn { background: linear-gradient(90deg, #ff7a7b, #ff4142); color: #fff; font-size: 15px; font-weight: bold; height: 40px; line-height: 40px; border-radius: 20px; padding: 0 25px; margin: 0; box-shadow: 0 4px 10px rgba(255, 65, 66, 0.2); transition: opacity 0.2s;}
.checkout-btn.disabled { background: #ccc; box-shadow: none; pointer-events: none;}
.checkout-btn::after { border: none; }
</style>
