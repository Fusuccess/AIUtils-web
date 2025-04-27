
import axios from 'axios';

// 创建一个 Axios 实例
const instance = axios.create({
    baseURL: 'http://localhost:8080',  // 设置基础 URL
    timeout: 10000,  // 设置请求超时时间
});

// 请求拦截器
instance.interceptors.request.use(
    config => {
        // 在请求之前做一些处理
        const token = localStorage.getItem('token');  // 从 localStorage 获取 Token
        if (token) {
            // 如果有 Token，将其添加到请求头
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        // 请求错误时的处理
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    response => {
        // 响应数据处理
        return response;
    },
    error => {
        // 响应错误时的处理
        if (error.response && error.response.status === 401) {
            alert('Token无效或已过期，请重新登录');
            localStorage.removeItem('token');  // 删除无效的 Token
            window.location.href = '/login';  // 跳转到登录页
        }
        return Promise.reject(error);
    }
);

export default instance;  // 确保正确导出

