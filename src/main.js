import { session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import config from 'config'
import { code, join } from 'telegraf/format'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const INITIAL_SESSION = {
  messages: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

const startSessionCallback = async (context) => {
  context.session = INITIAL_SESSION
  await context.reply('Жду Вашего голосового или текстового сообщения')
}

bot.command('new', startSessionCallback)
bot.command('start', startSessionCallback)

bot.on(message('voice'), async (context) => {
  context.session ??= INITIAL_SESSION
  try {
    await context.reply(code('Сообщение принято. Ждем ответ сервера...'))
    const { message: { from, voice }, telegram } = context
    const link = await telegram.getFileLink(voice.file_id)
    const userId = `${from.id}`
    const oggPath = await ogg.create(link.href, userId)
    const mp3Path = await ogg.toMp3(oggPath, userId)
    const text = await openai.transcription(mp3Path)
    await context.reply(join([code('Ваш запрос:'), code(text), code('Ждем ответ сервера...')], '\n'))
    context.session.messages.push({
      role: openai.roles.USER,
      content: text,
    })
    const response = await openai.chat(context.session.messages)
    const content = response?.content ?? 'Ошибка получения ответа'
    context.session.messages.push({
      role: openai.roles.ASSISTANT,
      content,
    })
    await context.reply(content)
  } catch (error) {
    console.log('Error while voice message:', error)
    await context.reply(code('Error while voice message: ', error))
    context.session = INITIAL_SESSION
  }
})

bot.on(message('text'), async (context) => {
  context.session ??= INITIAL_SESSION
  try {
    await context.reply(code('Сообщение принято. Ждем ответ сервера...'))
    const { message: { text } } = context
    context.session.messages.push({
      role: openai.roles.USER,
      content: text,
    })
    const response = await openai.chat(context.session.messages)
    context.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    })
    await context.reply(response.content)
  } catch (error) {
    console.log('Error while text message: ', error)
    await context.reply(code('Error while text message: ', error))
    context.session = INITIAL_SESSION
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
