<template>
  <view class="edit-container">
    <view class="form-group">
      <view class="form-item">
        <text class="label">收件人</text>
        <input class="input" type="text" v-model="form.receiver" placeholder="请填写收件人姓名" />
      </view>
      <view class="form-item">
        <text class="label">手机号码</text>
        <input class="input" type="number" v-model="form.phone" placeholder="请填写收件人手机号" maxlength="11" />
      </view>
      
      <view class="form-item">
        <text class="label">所在地区</text>
        <input class="input" type="text" v-model="form.region" placeholder="如: 广东省 深圳市 南山区" />
      </view>
      
      <view class="form-item align-top">
        <text class="label">详细地址</text>
        <textarea class="textarea" v-model="form.detail" placeholder="街道、楼牌号等详细信息"></textarea>
      </view>
    </view>

    <view class="form-group switch-box">
      <text class="label">设为默认收货地址</text>
      <switch :checked="form.isDefault === 1" color="#ff4142" @change="onSwitchChange" />
    </view>

    <view class="save-btn" @click="saveAddress">保存地址</view>
    
    <view class="del-btn" v-if="form.id" @click="deleteAddress">删除该地址</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/request.js';
import { onLoad } from '@dcloudio/uni-app';

const form = ref({
  id: null,
  receiver: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: 0
});

onLoad((options) => {
  if (options.id) {
    uni.setNavigationBarTitle({ title: '编辑收货地址' });
    fetchDetail(options.id);
  } else {
    uni.setNavigationBarTitle({ title: '新增收货地址' });
  }
});

const fetchDetail = async (id) => {
  try {
    const res = await request({ url: `/api/user/address/detail/${id}`, method: 'GET' });
    form.value = res.data;
  } catch (error) {}
};

const onSwitchChange = (e) => {
  form.value.isDefault = e.detail.value ? 1 : 0;
};

const saveAddress = async () => {
  if (!form.value.receiver || !form.value.phone || !form.value.region || !form.value.detail) {
    return uni.showToast({ title: '请填写完整信息', icon: 'none' });
  }
  
  uni.showLoading({ title: '保存中...' });
  try {
    await request({ url: '/api/user/address/save', method: 'POST', data: form.value });
    uni.hideLoading();
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => { uni.navigateBack(); }, 1000); 
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};

const deleteAddress = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    confirmColor: '#ff4142',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        await request({ url: `/api/user/address/delete/${form.value.id}`, method: 'DELETE' });
        uni.hideLoading();
        uni.showToast({ title: '已删除' });
        setTimeout(() => { uni.navigateBack(); }, 1000);
      }
    }
  });
};
</script>

<style scoped>
.edit-container { min-height: 100vh; background: #f6f6f6; padding: 15px; }
.form-group { background: #fff; border-radius: 10px; padding: 0 15px; margin-bottom: 15px; }
.form-item { display: flex; align-items: center; border-bottom: 1px solid #f9f9f9; padding: 15px 0; }
.form-item:last-child { border-bottom: none; }
.form-item.align-top { align-items: flex-start; }
.label { width: 80px; font-size: 14px; color: #333; font-weight: bold;}
.input { flex: 1; font-size: 14px; }
.textarea { flex: 1; height: 80px; font-size: 14px; line-height: 1.5; padding: 0;}
.switch-box { display: flex; justify-content: space-between; align-items: center; padding: 15px; }
.save-btn { background: linear-gradient(90deg, #ff7a7b, #ff4142); color: #fff; text-align: center; height: 44px; line-height: 44px; border-radius: 22px; font-size: 16px; font-weight: bold; margin-top: 30px;}
.del-btn { background: #fff; color: #666; text-align: center; height: 44px; line-height: 44px; border-radius: 22px; font-size: 16px; margin-top: 15px; border: 1px solid #ddd;}
</style>