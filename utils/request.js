// utils/request.js
import { API_BASE_URL } from './config.js';

/**
 * 统一请求封装
 * @param {Object} options
 * @param {string} options.url          - 接口路径 (不含 BASE_URL)
 * @param {string} options.method       - HTTP 方法，默认 GET
 * @param {Object} options.data         - 请求参数
 * @param {Object} options.header       - 额外的请求头
 * @param {boolean|string} options.loading - 自动 loading：true 显示默认文案，传字符串用自定义文案
 */
export const request = (options) => {
    return new Promise((resolve, reject) => {
        const token = uni.getStorageSync('token');

        // 全局 Loading：传了 loading 参数才显示
        if (options.loading) {
            const title = typeof options.loading === 'string' ? options.loading : '加载中...';
            uni.showLoading({ title, mask: true });
        }

        const done = () => {
            // 统一关闭 loading，必须在 showToast 之前执行
            // 因为 showToast 内部会自动关闭 loading，导致配对警告
            if (options.loading) {
                uni.hideLoading();
            }
        };

        uni.request({
            url: API_BASE_URL + options.url,
            method: options.method || 'GET',
            data: options.data,
            header: {
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.header
            },
            success: (res) => {
                if (res.statusCode === 401 || res.statusCode === 403) {
                    done();
                    uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
                    reject(res.data);
                } else if (res.data && res.data.code === 200) {
                    done();
                    resolve(res.data);
                } else if (res.data && res.data.code === 401) {
                    done();
                    uni.showToast({ title: '请先登录', icon: 'none' });
                    reject(res.data);
                } else {
                    done();
                    uni.showToast({ title: (res.data && res.data.message) || '请求失败', icon: 'none' });
                    reject(res.data);
                }
            },
            fail: (err) => {
                done();
                uni.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none' });
                reject(err);
            }
        });
    });
};
