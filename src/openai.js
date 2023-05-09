import { Configuration, OpenAIApi } from 'openai'
import config from 'config'
import { createReadStream } from 'fs'

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
    USER: 'user',
  }

  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    })

    this.openai = new OpenAIApi(configuration)
  }

  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages
      })

      return response.data.choices[0].message
    } catch (e) {
      const error = new Error(`Error while getting answer from the chat: ${e.message}`)
      console.log(error)
      throw error
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        'whisper-1',
      )
      return response.data.text
    } catch (e) {
      console.log('Error while transcription speech to text: ', e.message)
    }
  }
}

export const openai = new OpenAI(config.get('OPEN_AI_KEY'))
