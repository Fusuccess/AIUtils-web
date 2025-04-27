<template>
  <div class="chat-container">
    <div v-if="loginStatus" class="chat-box">
    <h1>AI代码注释与问题解答</h1>
    <textarea v-model="userInput" :maxlength=maxLength :placeholder="`请输入你的问题（最多${maxLength}字符）`"  @input="validateInput"></textarea>
    <p>剩余字符数：{{ maxLength - userInput.length }}</p>
    <button @click="sendRequest" :disabled="loading">
      <span v-if="loading">加载中...</span>
      <span v-else>发送</span></button>
    <div v-if="loading">请求中...</div>
    <div v-if="response">
      <h2>AI回应：</h2>
      <div v-if="response" class="ai-response answer" v-html="renderMarkdown(response)"></div>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="history.length > 0">
      <h3>历史记录</h3>
      <ul class="answer">
        <li v-for="(item, index) in history" :key="index">
          <hr/>
          <p><span>{{ item.prompt }}</span></p>
          <p><span v-html="renderMarkdown(item.answer)"></span></p>
        </li>
      </ul>
    </div>
    </div>
    <div v-else>
      <h1>登陆</h1>

      账号：<input placeholder="请输入账号" v-model="user.username">
      <br>
      密码：<input placeholder="请输入密码" type="password" v-model="user.password">
      <br>
      <div v-if="error" class="error">{{ error }}</div>

      <button @click="loginRequest" :disabled="loading">
        <span v-if="loading">登陆中...</span>
        <span v-else>登陆</span></button>
    </div>
  </div>
</template>

<script>
import axios from '@/api/axios';
import {marked} from 'marked';

export default {
  data() {
    return {
      userInput: '',
      response: '',
      error: '',
      loading: false,
      history: [],  // 用来保存历史记录
      maxLength: 200,  // 限制输入字符数
      loginStatus: false,  // 登录状态
      user: {
        username: '',
        password: ''
      }
    };
  },
  methods: {
    async loginRequest() {
      if (this.user.username === '' || this.user.password === '') {
        this.error = '账号或密码不能为空';
        return;
      }
      this.loading = true;
      const res = await axios.post('http://localhost:8080/auth/login', {
        username: this.user.username,
        password: this.user.password
      });
      if (res.data && res.data.status ==='success') {
        console.log(res.data.data)
        localStorage.setItem('token', res.data.data);  // 将 token 保存在 localStorage
        this.loginStatus = true;  // 登录成功，更新登录状态
      }else {
        this.error =  res.data.data;
      }
      this.loading = false;
    },
    // 输入校验
    validateInput() {
      if (this.userInput.length > this.maxLength) {
        this.error = `最多输入${this.maxLength}个字符！`;
      } else {
        this.error = '';
      }
    },
    // 渲染 Markdown
    renderMarkdown(markdownText) {
      return marked(markdownText);  // 使用新的 marked 导入方式
    },
    async sendRequest() {
      if (this.error || !this.userInput.trim()) {
        this.error = this.error || '请输入有效内容';
        return;
      }
      this.error = '';
      this.loading = true;

      let response = this.localStorageLoad(`aiResponse_${this.userInput}`);
      if(response !== null){
        this.response = response;
        this.history.push({
          prompt: this.userInput,
          answer: this.response
        });
        this.loading = false;
        return;
      }
      try {
        const res =await axios.post('http://localhost:8080/ai', {
          prompt: this.userInput
        });
        if (res.data && res.data.status === 'success') {
          this.response = res.data.data;
          this.history.push({
            prompt: this.userInput,
            answer: this.response
          });
          this.localStorageSave(`aiResponse_${this.userInput}`,this.response ,1800000);
        } else {
          this.error =  res.data.data;
        }
      } catch (err) {
        if (err.response) {
          // 请求已发出，服务器返回了状态码
          this.error = `请求错误: ${err.response.status}`;
        } else if (err.request) {
          // 请求已发出但没有收到响应
          this.error = '网络错误，请检查网络连接';
        } else {
          // 其他错误
          this.error = '请求失败，请重试！';
        }
      } finally {
        this.loading = false;
      }
    },
    localStorageSave(key,value, expiryTime = 3600000){
      const data = {
        value: value,
        timestamp: Date.now(),  // 当前时间戳
        expiry: expiryTime  // 设置缓存过期时间，单位毫秒，默认1小时
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    localStorageLoad(key){
      const cachedResponse = JSON.parse(localStorage.getItem(key));
      if (!cachedResponse) {
        return null;  // 没有缓存数据
      }

      const currentTime = Date.now();
      const cacheAge = currentTime - cachedResponse.timestamp;

      // 如果缓存已经过期，返回 null
      if (cacheAge > cachedResponse.expiry) {
        localStorage.removeItem(key);  // 清除过期缓存
        return null;  // 缓存过期，返回 null
      }
      // 缓存未过期，返回缓存的 value
      return cachedResponse.value;
    }
  }
};
</script>

<style scoped>
.chat-container {
  width: 800px;
  margin: 50px auto;
  text-align: center;
}
textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
}
button {
  padding: 10px 20px;
  margin: 10px 0;
  cursor: pointer;
}
.error {
  color: red;
  font-size: 12px;
}
.answer{
  text-align: left;
}
</style>
