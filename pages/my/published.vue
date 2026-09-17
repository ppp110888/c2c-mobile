<template>
  <view class="published-container">
    <view v-if="itemList.length === 0" class="empty-tip">您还没有发布过闲置，快去断舍离吧~</view>
    
    <view class="item-list" v-else>
      <view class="item-card" v-for="item in itemList" :key="item.id" @click="goToDetail(item.id)">
        <image class="item-img" :src="item.images ? item.images.split(',')[0] : 'https://picsum.photos/200'" mode="aspectFill"></image>
        <view class="item-info">
          <text class="item-title">{{ item.title }}</text>
          
          <view class="item-bottom">
            <view class="price-wrap">
              <text class="item-price">￥{{ item.price }}</text>
              <text class="item-status" :class="{ sold: item.status === 2 }">{{ item.status === 2 ? '已卖出' : '出售中' }}</text>
            </view>
          </view>
          <view class="btn-group">
            <view class="btn-edit" @click.stop="goToEdit(item.id)">编辑商品</view>
            <view class="btn-delete" @click.stop="confirmDelete(item.id)">删除</view>
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

const itemList = ref([]);

onShow(() => {
  fetchMyPublished();
});

const fetchMyPublished = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({ url: '/api/item/my/list', method: 'GET' });
    itemList.value = res.data || [];
  } catch (e) {
    console.error('获取发布列表失败', e);
  } finally {
    uni.hideLoading();
  }
};

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?itemId=${id}` });
};

// 🚨 跳转到专门的商品编辑页
const goToEdit = (id) => {
  uni.navigateTo({ url: `/pages/my/edit-item?itemId=${id}` });
};

const confirmDelete = async (itemId) => {
  const res = await uni.showModal({ title: '确认删除', content: '删除后无法恢复，确定要删除该商品吗？' });
  if (res.confirm) {
    try {
      await request({ url: `/api/item/my/delete/${itemId}`, method: 'DELETE', loading: '删除中...' });
      uni.showToast({ title: '已删除', icon: 'success' });
      fetchMyPublished();
    } catch (e) {}
  }
};
</script>

<style scoped>
.published-container { min-height: 100vh; background: #f6f6f6; padding: 15px; }
.empty-tip { text-align: center; color: #999; margin-top: 50px; font-size: 14px;}
.item-card { display: flex; background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.item-img { width: 80px; height: 80px; border-radius: 8px; margin-right: 15px; background: #eee; border: 1px solid #f0f0f0;}
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.item-title { font-size: 15px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4;}
.item-bottom { display: flex; align-items: center; margin-bottom: 10px;}
.price-wrap { display: flex; align-items: center;}
.item-price { font-size: 18px; color: #ff4142; font-weight: bold; margin-right: 8px;}
.item-status { font-size: 11px; color: #ff9900; background: #fff8e6; padding: 2px 8px; border-radius: 10px; }
.item-status.sold { color: #999; background: #f0f0f0; }
.btn-group { display: flex; gap: 10px; justify-content: flex-end; }
.btn-edit { border: 1px solid #ff4142; color: #ff4142; font-size: 12px; padding: 6px 18px; border-radius: 15px; transition: all 0.2s; font-weight: bold;}
.btn-edit:active { background: #fff0f0; }
.btn-delete { border: 1px solid #ddd; color: #999; font-size: 12px; padding: 6px 18px; border-radius: 15px; transition: all 0.2s; }
.btn-delete:active { background: #f5f5f5; }
</style>