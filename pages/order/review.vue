<template>
  <view class="review-container">
    <view class="rating-box">
      <text class="title">您对本次交易满意吗？</text>
      <view class="stars">
        <text 
          v-for="i in 5" 
          :key="i" 
          class="star" 
          :class="{ active: i <= formData.rating }" 
          @click="formData.rating = i"
        >★</text>
      </view>
      <text class="rating-text">{{ ratingTexts[formData.rating - 1] }}</text>
    </view>

    <view class="input-box">
      <textarea 
        class="textarea" 
        v-model="formData.content" 
        placeholder="展开说说你的交易体验吧，无论是好是坏，都能帮助到其他小伙伴哦~"
        maxlength="200"
      ></textarea>
      <text class="word-count">{{ formData.content.length }}/200</text>
    </view>

    <button class="submit-btn" @click="submitReview">提交评价</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request.js';

const formData = ref({
  orderId: '',
  targetId: '', // 对方的ID
  itemId: '',
  rating: 5,
  content: ''
});

const ratingTexts = ['极差，避坑', '有点失望', '中规中矩', '比较满意', '非常满意，极力推荐！'];

onLoad((options) => {
  // 接收从订单列表动态计算传过来的参数
  formData.value.orderId = options.orderId;
  formData.value.targetId = options.targetId; 
  formData.value.itemId = options.itemId;
});

const submitReview = async () => {
  if (!formData.value.content.trim()) {
    return uni.showToast({ title: '写点评价内容吧~', icon: 'none' });
  }

  uni.showLoading({ title: '提交中...' });
  try {
    await request({
      url: '/api/order/review/add',
      method: 'POST',
      data: formData.value
    });
    
    uni.hideLoading();
    uni.showToast({ title: '评价成功！', icon: 'success' });
    
    // 评完自动返回订单列表
    setTimeout(() => {
      uni.navigateBack(); 
    }, 1500);
  } catch (error) {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.review-container { min-height: 100vh; background: #f6f6f6; padding: 15px; }
.rating-box { background: #fff; border-radius: 15px; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);}
.title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 20px; }
.stars { display: flex; gap: 15px; margin-bottom: 15px; }
.star { font-size: 45px; color: #eee; transition: color 0.2s; }
.star.active { color: #ffca28; text-shadow: 0 2px 8px rgba(255, 202, 40, 0.4);}
.rating-text { font-size: 14px; color: #ff9900; font-weight: bold; background: #fff8e6; padding: 4px 12px; border-radius: 12px;}

.input-box { background: #fff; border-radius: 15px; padding: 15px; position: relative; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);}
.textarea { width: 100%; height: 120px; font-size: 15px; line-height: 1.5; color: #333; }
.word-count { position: absolute; right: 15px; bottom: 15px; font-size: 12px; color: #999; }

.submit-btn { background: linear-gradient(90deg, #ff4142, #ff7a7b); color: #fff; font-size: 16px; font-weight: bold; border-radius: 25px; height: 45px; line-height: 45px; box-shadow: 0 4px 10px rgba(255, 65, 66, 0.3); }
.submit-btn::after { border: none; }
</style>