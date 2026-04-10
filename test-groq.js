const fetch = require('node-fetch');

async function test() {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer invalid_key`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [{role: "user", content: "hello"}]
    })
  });
  console.log(response.status);
  console.log(await response.text());
}
test();
