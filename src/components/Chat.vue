<template>
  <div class="chat-container">
    <h1>AI代码注释与问题解答</h1>
    <textarea v-model="userInput" placeholder="请输入代码或问题"></textarea>
    <button @click="sendRequest">提交</button>
    <div v-if="loading">请求中...</div>
    <div v-if="response">
      <h2>AI回应：</h2>
      <pre>{{ response }}</pre>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>

</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userInput: '',
      response: '',
      error: '',
      loading: false
    };
  },
  methods: {
    async sendRequest() {
      if (!this.userInput) {
        this.error = '请输入有效内容';
        return;
      }
      this.error = ''; // 清空错误信息
      this.loading = true;
      try {
        const res = await axios.post('http://localhost:8080/ai', {
          prompt: this.userInput
        });
        this.response = res.data.choices[0].message.content;
      } catch (err) {
        this.error = '请求失败，请重试！';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.chat-container {
  width: 400px;
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
}
</style>
