<template>
  <div class="chat-container">

    <div>
      <h1>关于</h1>
      <span v-html="renderMarkdown(about)"></span>
    </div>
    <button @click="goBack">返回上一页</button>

  </div>
</template>

<script>
import axios from '@/api/axios';
import {marked} from 'marked';
import JSEncrypt from 'jsencrypt'

export default {
  data() {
    return {
      userInput: '',
      response: '',
      error: '',
      loading: false,
      history: [],  // 用来保存历史记录
      maxLength: 200,  // 限制输入字符数
      loginStatus: 'login',  // 登录状态  logged  login   register
      user: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      userInfo: {
        username: ''
      },
      about:" 👤 Ordinary young programmer, _BSc in Computer Science_\n <br>" +
          " 🏃 Cycling / swimming / running / badminton\n <br>" +
          " 🗺️ ShangHai / WuHan / GuangZhou / ShenZhen\n <br>" +
          " 💻 [Website](https://fusuccess.top)"
    };
  },
  created() {
    this.fetchPublicKey()
  },
  methods: {
    goBack() {
      this.$router.go(-1) // 或者 this.$router.back()
    },
    async fetchPublicKey() {
      try {
        const res = await axios.get('http://localhost:8080/rsa/publicKey')
        const publicKey = res.data.data
        this.localStorageSave('rsaPublicKey', publicKey);
      } catch (e) {
        console.error('获取公钥失败', e)
      }
    },
    clickLogout(){
      localStorage.removeItem('token');
      this.loginStatus = 'login';
      this.userInfo.username = '';
      this.error = '退出成功，请登录';
    },
    async registerRequest() {
      if (this.user.username === '' || this.user.password === '' || this.user.confirmPassword === '') {
        this.error = '账号或密码不能为空';
        return;
      }

      if (this.user.password !== this.user.confirmPassword) {
        this.error = '两次密码不一致';
        return;
      }
      this.loading = true;
      const res = await axios.post('http://localhost:8080/auth/register', {
        username: this.user.username,
        password: this.user.password
      });
      if (res.data && res.data.status === 'success') {
        // localStorage.setItem('token', res.data.data);  // 将 token 保存在 localStorage
        this.loginStatus = 'login';  // 登录成功，更新登录状态
        // this.userInfo.username = this.user.username;
        this.error = '注册成功，请登录';
      } else {
        this.error = res.data.data;
      }
      this.loading = false;
    },
    async loginRequest() {
      if (this.user.username === '' || this.user.password === '') {
        this.error = '账号或密码不能为空';
        return;
      }
      let rsaPublicKey=  this.localStorageLoad('rsaPublicKey');
      if (!rsaPublicKey) {
        await this.fetchPublicKey();
        rsaPublicKey =  this.localStorageLoad('rsaPublicKey');
      }

      const encryptor = new JSEncrypt()
      encryptor.setPublicKey(rsaPublicKey)
      const timestamp = Date.now() // 当前时间戳（毫秒）
      const rawData = `${this.user.username}:::${this.user.password}:::${timestamp}`
      const encryptedData = encryptor.encrypt(rawData)

      this.loading = true;
      const res = await axios.post('http://localhost:8080/auth/login', {
        username: this.user.username,
        password: encryptedData
      });
      if (res.data && res.data.status === 'success') {
        localStorage.setItem('token', res.data.data);  // 将 token 保存在 localStorage
        this.loginStatus = 'logged';  // 登录成功，更新登录状态
        this.userInfo.username = this.user.username;
        this.error = '';
      } else {
        this.error = res.data.data;
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
      if (response !== null) {
        this.response = response;
        this.history.push({
          prompt: this.userInput,
          answer: this.response
        });
        this.loading = false;
        return;
      }
      try {
        const res = await axios.post('http://localhost:8080/ai', {
          prompt: this.userInput
        });
        if (res.data && res.data.status === 'success') {
          this.response = res.data.data;
          this.history.push({
            prompt: this.userInput,
            answer: this.response
          });
          this.localStorageSave(`aiResponse_${this.userInput}`, this.response, 1800000);
        } else {
          this.error = res.data.data;
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
    localStorageSave(key, value, expiryTime = 3600000) {
      const data = {
        value: value,
        timestamp: Date.now(),  // 当前时间戳
        expiry: expiryTime  // 设置缓存过期时间，单位毫秒，默认1小时
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    localStorageLoad(key) {
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

.answer {
  text-align: left;
}

.userInfo {
  margin-right: 10px;
  text-align: right;

}
</style>
