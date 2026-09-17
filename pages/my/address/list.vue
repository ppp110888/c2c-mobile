<template>
  <view class="address-container">
    <view v-if="addressList.length === 0" class="empty-tip">
      <text class="icon">🏠</text>
      <text>暂无收货地址，快去添加一个吧~</text>
    </view>

    <view class="address-list" v-else>
      <view class="address-item" v-for="item in addressList" :key="item.id">
        <view class="info-box">
          <view class="user-line">
            <text class="name">{{ item.receiver }}</text>
            <text class="phone">{{ item.phone }}</text>
            <text class="tag" v-if="item.isDefault === 1">默认</text>
          </view>
          <view class="address-line">{{ item.region }} {{ item.detail }}</view>
        </view>
        <view class="action-box">
          <text class="edit-btn" @click="goToEdit(item.id)">编辑</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="add-btn" @click="goToEdit('')">新增收货地址</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/request.js';
import { onShow } from '@dcloudio/uni-app';

const addressList = ref([]);

// 每次进入页面都重新拉取，确保列表是最新的
onShow(() => {
  fetchAddressList();
});

const fetchAddressList = async () => {
  try {
    const res = await request({ url: '/api/user/address/list', method: 'GET' });
    addressList.value = res.data || [];
  } catch (error) {
    uni.showToast({ title: '获取地址失败', icon: 'none' });
  }
};

const goToEdit = (id) => {
  const url = id ? `/pages/my/address/edit?id=${id}` : '/pages/my/address/edit';
  uni.navigateTo({ url });
};
</script>

<style scoped>
.address-container { min-height: 100vh; background: #f6f6f6; padding: 15px; padding-bottom: 80px;}
.empty-tip { display: flex; flex-direction: column; align-items: center; color: #999; margin-top: 100px; font-size: 14px; }
.empty-tip .icon { font-size: 40px; margin-bottom: 10px; }
.address-item { background: #fff; border-radius: 10px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.02);}
.info-box { flex: 1; margin-right: 15px;}
.user-line { display: flex; align-items: center; margin-bottom: 8px;}
.name { font-size: 16px; font-weight: bold; color: #333; margin-right: 10px;}
.phone { font-size: 14px; color: #666; margin-right: 10px;}
.tag { font-size: 10px; background: #ff4142; color: #fff; padding: 2px 6px; border-radius: 4px;}
.address-line { font-size: 13px; color: #666; line-height: 1.4;}
.edit-btn { font-size: 14px; color: #999; padding-left: 15px; border-left: 1px solid #eee;}

.bottom-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 15px; background: #fff; box-sizing: border-box; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding-bottom: calc(15px + env(safe-area-inset-bottom));}
.add-btn { background: linear-gradient(90deg, #ff7a7b, #ff4142); color: #fff; text-align: center; height: 44px; line-height: 44px; border-radius: 22px; font-size: 16px; font-weight: bold;}
</style>