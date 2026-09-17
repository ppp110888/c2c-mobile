<template>
  <view class="c2c-chat-container">
    
    <scroll-view class="c2c-chat-scroll" scroll-y :scroll-into-view="scrollIntoId" scroll-with-animation>
      <view class="c2c-msg-box" v-for="msg in msgList" :key="msg.id" :id="'msg-' + msg.id">
        
        <view class="c2c-msg-row c2c-left" v-if="String(msg.sender_id) !== String(currentUserId)">
          <image style="width: 40px; height: 40px; border-radius: 20px; background: #ddd; flex-shrink: 0; margin-right: 12px;"
                 :src="formatUrl(targetAvatar) || 'https://picsum.photos/100/100?random=1'" mode="aspectFill" @click="goToProfile(targetId)"></image>
          <view class="c2c-chat-bubble c2c-left-bubble">{{ msg.content }}</view>
        </view>

        <view class="c2c-msg-row c2c-right" v-else>
          <view class="c2c-chat-bubble c2c-right-bubble">{{ msg.content }}</view>
          <image style="width: 40px; height: 40px; border-radius: 20px; background: #ddd; flex-shrink: 0; margin-left: 12px;"
                 :src="formatUrl(myAvatar) || 'https://picsum.photos/100/100?random=2'" mode="aspectFill"></image>
        </view>

      </view>
      <view class="c2c-bottom-placeholder"></view>
    </scroll-view>

    <view class="c2c-input-bar">
      <input class="c2c-chat-input" type="text" v-model="inputText" placeholder="发送实时消息..." confirm-type="send" @confirm="sendMessage" />
      <view class="c2c-send-btn" :class="{ active: inputText.trim().length > 0 }" @click="sendMessage">发送</view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { request } from '@/utils/request.js';
import { WS_URL, mediaUrl } from '@/utils/config.js';
import { onLoad } from '@dcloudio/uni-app';

const targetId = ref('');
const targetName = ref('');
const targetAvatar = ref('');
const myAvatar = ref('');
const currentUserId = ref('');

const msgList = ref([]);
const inputText = ref('');
const scrollIntoId = ref('');

let socketTask = null; // WebSocket 实例

onLoad((options) => {
  if (options.toUserId) {
    targetId.value = options.toUserId;
    currentUserId.value = uni.getStorageSync('userId');
    
    initChatEnvironment();
  }
});

// 页面销毁时，主动断开 WebSocket
onUnmounted(() => {
  if (socketTask) {
    socketTask.close();
  }
});

const initChatEnvironment = async () => {
  uni.showLoading({ title: '拉取聊天记录...' });
  
  // 1. 获取对方真实信息
  try {
    const res = await request({ url: `/api/user/public/info?userId=${targetId.value}`, method: 'GET' });
    targetName.value = res.data.nickname;
    targetAvatar.value = res.data.avatar;
    uni.setNavigationBarTitle({ title: targetName.value }); 
  } catch (e) {}

  // 2. 获取我的真实信息
  try {
    const myRes = await request({ url: `/api/user/info`, method: 'GET' });
    myAvatar.value = myRes.data.avatar;
  } catch (e) {}

  // 3. 从 MongoDB 拉取真正的历史记录
  await fetchHistory();
  
  uni.hideLoading();

  // 4. 建立 WebSocket 长连接
  connectWebSocket(); 
};

const fetchHistory = async () => {
  try {
    const res = await request({ url: `/api/message/history?targetId=${targetId.value}`, method: 'GET' });
    const historyData = res.data || [];
    
    // 把 MongoDB 的实体字段映射到前端
    msgList.value = historyData.map(item => ({
      id: item.id || Date.now() + Math.random(), 
      sender_id: item.fromUserId, 
      content: item.content
    }));
    
    scrollToBottom();
  } catch (error) {
    console.error("拉取历史消息失败", error);
  }
};

const connectWebSocket = () => {
  const token = uni.getStorageSync('token');
  if (!token) return;

  socketTask = uni.connectSocket({
    url: WS_URL,
    success: () => console.log('✅ WebSocket 连接请求已发送'),
    fail: () => uni.showToast({ title: '聊天服务器连接失败', icon: 'none' })
  });

  socketTask.onOpen(() => {
    // 建立连接后发送认证包
    socketTask.send({ data: JSON.stringify({ type: 1, token: token }) });
  });

  // ==========================================
  // 🚨 严密过滤：监听 Netty 服务器发来的消息
  // ==========================================
  socketTask.onMessage((res) => {
    const text = res.data;
    
    // 只有以 "新消息: " 开头的，才是真正的聊天内容！
    if (text.startsWith('新消息: ')) {
      const content = text.substring(5); 
      msgList.value.push({
        id: Date.now(),
        sender_id: targetId.value, // 对方发的
        content: content
      });
      scrollToBottom();
    } 
    // 🚨 拦截底层系统回执：如果是认证成功等系统通知，只打印在控制台，绝对不推入消息数组！
    else if (text.startsWith('系统: ')) {
      console.log('🤖 底层通知拦截成功:', text);
    }
  });
};

const sendMessage = () => {
  if (!inputText.value.trim() || !socketTask) return;
  const content = inputText.value;
  inputText.value = ''; 

  // 自己发的消息，本地先渲染
  msgList.value.push({
    id: Date.now(),
    sender_id: currentUserId.value, // 我发的
    content: content
  });
  scrollToBottom();

  // 推给 Netty 服务器
  socketTask.send({
    data: JSON.stringify({ type: 2, toUserId: parseInt(targetId.value), content: content }),
    fail: () => {
      uni.showToast({ title: '网络异常，发送失败', icon: 'none' });
    }
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (msgList.value.length > 0) {
      scrollIntoId.value = 'msg-' + msgList.value[msgList.value.length - 1].id;
    }
  });
};

const goToProfile = (userId) => {
  if (userId) uni.navigateTo({ url: `/pages/profile/profile?userId=${userId}` });
};

const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return mediaUrl(url);
};
</script>

<style scoped>
/* 为了防止与其他页面的样式名冲突，我给聊天室加了专属的 c2c 前缀 */
.c2c-chat-container { height: 100vh; display: flex; flex-direction: column; background: #f6f6f6; }
.c2c-chat-scroll { flex: 1; padding: 15px; box-sizing: border-box; }
.c2c-bottom-placeholder { height: 20px; }

.c2c-msg-box { margin-bottom: 20px; }
.c2c-msg-row { display: flex; align-items: flex-start; }
.c2c-left { flex-direction: row; }
.c2c-right { flex-direction: row; justify-content: flex-end; }

.c2c-chat-bubble { max-width: 65%; padding: 10px 14px; font-size: 15px; line-height: 1.5; border-radius: 12px; word-break: break-all;}
.c2c-left-bubble { background: #fff; color: #333; border-top-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);}
.c2c-right-bubble { background: #ff4142; color: #fff; border-top-right-radius: 4px; box-shadow: 0 2px 5px rgba(255, 65, 66, 0.2);}

.c2c-input-bar { height: 60px; background: #fff; display: flex; align-items: center; padding: 0 15px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom); }
.c2c-chat-input { flex: 1; background: #f0f0f0; height: 38px; border-radius: 19px; padding: 0 15px; font-size: 14px; margin-right: 12px; }
.c2c-send-btn { background: #ddd; color: #fff; height: 34px; line-height: 34px; padding: 0 18px; border-radius: 17px; font-size: 14px; font-weight: bold; transition: all 0.2s;}
.c2c-send-btn.active { background: #ff4142; }
</style>
