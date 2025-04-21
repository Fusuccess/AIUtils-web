<template>
  <div class="chat-container">
    <h1>AI代码注释与问题解答</h1>
    <textarea v-model="userInput" :maxlength=maxLength :placeholder="`请输入你的问题（最多${maxLength}字符）`"  @input="validateInput"></textarea>
    <button @click="sendRequest" :disabled="loading">
      <span v-if="loading">加载中...</span>
      <span v-else>发送</span></button>
    <div v-if="loading">请求中...</div>
    <div v-if="response">
      <h2>AI回应：</h2>
      <pre class="answer">{{ response }}</pre>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="history.length > 0">
      <h3>历史记录</h3>
      <ul class="answer">
        <li v-for="(item, index) in history" :key="index">
          <p><strong>问题：</strong>{{ item.prompt }}</p>
          <p><strong>回答：</strong>{{ item.answer }}</p>
        </li>
      </ul>
    </div>
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
      loading: false,
      history: [],  // 用来保存历史记录
      maxLength: 200  // 限制输入字符数
    };
  },
  methods: {
    // 输入校验
    validateInput() {
      if (this.userInput.length > this.maxLength) {
        this.error = `最多输入${this.maxLength}个字符！`;
      } else {
        this.error = '';
      }
    },
    async sendRequest() {
      if (this.error || !this.userInput.trim()) {
        this.error = this.error || '请输入有效内容';
        return;
      }
      this.error = ''; // 清空错误信息
      this.loading = true;
      try {
        const res = await axios.post('http://localhost:8080/ai', {
          prompt: this.userInput
        });
        if (res.data && res.data.status === 'success') {
          this.response = res.data.data; // 直接获取data字段内容
          this.history.push({
            prompt: this.userInput,
            answer: this.response
          });
        } else {
          this.error = 'AI没有返回有效结果';
        }

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
