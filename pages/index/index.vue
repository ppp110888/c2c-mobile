<template>
  <view class="home-container">
    
    <view class="header-wrap">
      <view class="search-bar" :class="{ 'is-searching': isSearching }">
        <input 
          class="search-input" 
          type="text" 
          v-model="searchKeyword" 
          placeholder="🔍 搜索你想要的二手宝贝..." 
          confirm-type="search"
          @confirm="handleSearch"
        />
      </view>
      <text class="back-btn" v-if="isSearching" @click="clearSearch">取消</text>
    </view>

    <view class="search-tips" v-if="isSearching">
      <text>为您找到 "{{ searchKeyword }}" 的相关商品</text>
    </view>

    <!-- 🚨 价格区间筛选栏（搜索模式下显示） -->
    <view class="price-filter-bar" v-if="isSearching">
      <view class="price-input-wrap">
        <input class="price-input" type="digit" v-model="minPrice" placeholder="最低价" @confirm="applyPriceFilter" />
        <text class="price-sep">—</text>
        <input class="price-input" type="digit" v-model="maxPrice" placeholder="最高价" @confirm="applyPriceFilter" />
      </view>
      <view class="filter-actions">
        <view class="btn-filter" @click="applyPriceFilter">筛选</view>
        <view class="btn-reset" v-if="hasPriceFilter" @click="resetPriceFilter">重置</view>
      </view>
    </view>

    <view class="goods-list">
      <view class="goods-card" v-for="item in itemList" :key="item.id" @click="goToDetail(item.id)">
        <view class="img-wrap">
          <image class="goods-img" :src="formatImgUrl(item.images)" mode="aspectFill"></image>
        </view>
        <view class="goods-info">
          <view class="goods-title" v-html="item.title"></view>
          <view class="price-box">
            <text class="price-symbol">￥</text>
            <text class="goods-price">{{ item.price }}</text>
            <text class="city-tag">{{ item.city || '未知城市' }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="itemList.length === 0" class="empty-tip">
      空空如也，换个关键词搜搜看吧~
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/request.js';
import { mediaUrl } from '@/utils/config.js';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';

const itemList = ref([]);
const searchKeyword = ref('');
// 🚨 新增：记录当前是否处于搜索状态
const isSearching = ref(false);

// 🚨 价格区间筛选
const minPrice = ref('');
const maxPrice = ref('');
const minPriceApplied = ref('');
const maxPriceApplied = ref('');
const hasPriceFilter = ref(false);


onShow(() => {
  if (!isSearching.value) {
    fetchHomeList();
  }
});

onPullDownRefresh(async () => {
  searchKeyword.value = ''; 
  isSearching.value = false;
  await fetchHomeList();    
  uni.stopPullDownRefresh(); 
  uni.showToast({ title: '刷新成功', icon: 'none' });
});

const goToDetail = (id) => { 
  uni.navigateTo({ url: '/pages/detail/detail?itemId=' + id }); 
};

const formatImgUrl = (imagesStr) => {
  if (!imagesStr) return 'https://picsum.photos/400/400?random=99'; 
  const firstUrl = String(imagesStr).split(',')[0];
  if (firstUrl.startsWith('http')) return firstUrl;
  return mediaUrl(firstUrl);
};

const filterOwnItems = (list) => {
  if (!list || list.length === 0) return [];
  const currentUserId = uni.getStorageSync('userId');
  if (!currentUserId) return list; 
  
  return list.filter(item => {
    const sellerId = item.sellerId || item.seller_id; 
    if (!sellerId) return false; 
    return String(sellerId) !== String(currentUserId);
  });
};

const fetchHomeList = async () => {
  try {
    const res = await request({ url: '/api/item/home/list', method: 'GET' });
    itemList.value = filterOwnItems(res.data);
    isSearching.value = false; // 确保拉取首页数据时状态归位
  } catch (error) {
    console.error("获取首页商品失败", error);
  }
};

const buildSearchData = () => {
  const data = { pageNum: 1, pageSize: 10 };
  if (searchKeyword.value.trim()) data.keyword = searchKeyword.value.trim();
  if (minPrice.value && parseFloat(minPrice.value) >= 0) data.minPrice = parseFloat(minPrice.value);
  if (maxPrice.value && parseFloat(maxPrice.value) >= 0) data.maxPrice = parseFloat(maxPrice.value);
  return data;
};

const handleSearch = async () => {
  const data = buildSearchData();
  if (!data.keyword && !data.minPrice && !data.maxPrice) {
    clearSearch();
    return;
  }
  uni.showLoading({ title: '搜索中...' });
  try {
    const res = await request({ url: '/api/item/search', method: 'POST', data });

    if (res.data && res.data.records) {
      itemList.value = filterOwnItems(res.data.records);
      isSearching.value = true;
      minPriceApplied.value = minPrice.value;
      maxPriceApplied.value = maxPrice.value;
      hasPriceFilter.value = !!(minPrice.value || maxPrice.value);
    } else {
       itemList.value = [];
       isSearching.value = true;
       hasPriceFilter.value = !!(minPrice.value || maxPrice.value);
    }
  } catch (error) {
    console.error("搜索失败", error);
  } finally {
    uni.hideLoading();
  }
};

const applyPriceFilter = () => {
  minPriceApplied.value = minPrice.value;
  maxPriceApplied.value = maxPrice.value;
  hasPriceFilter.value = !!(minPrice.value || maxPrice.value);
  handleSearch();
};

const resetPriceFilter = () => {
  minPrice.value = '';
  maxPrice.value = '';
  minPriceApplied.value = '';
  maxPriceApplied.value = '';
  hasPriceFilter.value = false;
  if (searchKeyword.value.trim()) {
    handleSearch();
  } else {
    clearSearch();
  }
};

// 🚨 新增：清除搜索并回到首页大厅
const clearSearch = () => {
  searchKeyword.value = '';
  minPrice.value = '';
  maxPrice.value = '';
  minPriceApplied.value = '';
  maxPriceApplied.value = '';
  hasPriceFilter.value = false;
  isSearching.value = false;
  fetchHomeList();
};

onLoad(() => { fetchHomeList(); });
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f6f6f6; padding: 10px; position: relative; padding-bottom: 50px;}

/* 顶栏弹性布局 */
.header-wrap { display: flex; align-items: center; position: sticky; top: 0; z-index: 100; margin-bottom: 12px; background: #f6f6f6; padding: 4px 0;}
.search-bar { flex: 1; background-color: #ffffff; padding: 8px 15px; border-radius: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: all 0.3s;}
.search-bar.is-searching { box-shadow: none; border: 1px solid #ff4142; }
.search-input { width: 100%; font-size: 14px; height: 30px; line-height: 30px; }
.back-btn { font-size: 15px; color: #666; margin-left: 12px; white-space: nowrap; font-weight: bold; transition: color 0.2s;}
.back-btn:active { color: #ff4142; }

/* 搜索提示 */
.search-tips { font-size: 12px; color: #999; margin-bottom: 10px; padding-left: 5px; }

/* 价格区间筛选栏 */
.price-filter-bar { display: flex; align-items: center; background: #fff; border-radius: 12px; padding: 10px 12px; margin-bottom: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.price-input-wrap { flex: 1; display: flex; align-items: center; }
.price-input { flex: 1; height: 32px; background: #f6f6f6; border-radius: 8px; text-align: center; font-size: 13px; color: #333; padding: 0 6px; }
.price-sep { margin: 0 8px; color: #ccc; font-size: 14px; }
.filter-actions { display: flex; align-items: center; margin-left: 10px; gap: 8px; }
.btn-filter { background: #ff4142; color: #fff; font-size: 12px; padding: 6px 14px; border-radius: 15px; font-weight: bold; white-space: nowrap; }
.btn-filter:active { opacity: 0.8; }
.btn-reset { font-size: 12px; color: #999; border: 1px solid #ddd; padding: 5px 10px; border-radius: 15px; white-space: nowrap; }
.btn-reset:active { background: #f5f5f5; }

.goods-list { display: flex; flex-wrap: wrap; justify-content: space-between; }
@media (min-width: 768px) { .goods-list { max-width: 800px; margin: 0 auto; } }
.goods-card { width: 48%; background-color: #ffffff; border-radius: 10px; margin-bottom: 15px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.1s; display: flex; flex-direction: column;}
.goods-card:active { transform: scale(0.98); }
.img-wrap { width: 100%; aspect-ratio: 1 / 1; position: relative; background: #eee; flex-shrink: 0;}
.goods-img { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
.goods-info { padding: 10px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;}
.goods-title { font-size: 14px; font-weight: bold; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4;}
:deep(.goods-title em) { color: #ff4142; font-style: normal; }
.price-box { margin-top: 10px; display: flex; align-items: baseline; position: relative; }
.price-symbol { color: #ff4142; font-style: normal; font-size: 12px; }
.goods-price { color: #ff4142; font-size: 18px; font-weight: bold; }
.city-tag { position: absolute; right: 0; font-size: 10px; color: #999; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
.empty-tip { text-align: center; color: #999; font-size: 14px; padding-top: 50px; width: 100%; }
</style>
