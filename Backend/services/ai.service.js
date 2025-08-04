const openai = require('../config/openai');

exports.generateContent = async (prompt, options = {}) => {
  try {
    const { data } = await openai.createChatCompletion({
      model: options.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 512,
      ...options,
    });
    return data.choices[0].message.content;
  } catch (err) {
    throw new Error('AI generation failed: ' + err.message);
  }
};