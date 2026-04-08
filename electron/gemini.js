import { spawn } from 'node:child_process'

const GEMINI_TIMEOUT_MS = 30_000

function buildPageLabel(page = {}) {
  return {
    id: page.id || '',
    title: page.title || 'Untitled',
    object: page.object || 'page',
    parentType: page.parentType || null,
    parentId: page.parentId || null,
    url: page.url || '',
  }
}

function buildSystemPrompt(userMessage, context = {}) {
  const today =
    context.today ||
    new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  const selectedPage = context.selectedPage
    ? buildPageLabel(context.selectedPage)
    : null
  const availablePages = Array.isArray(context.availablePages)
    ? context.availablePages.slice(0, 50).map(buildPageLabel)
    : []

  return [
    'You are AutoNotion, an assistant that plans Notion actions for a desktop app.',
    'Return ONLY valid JSON.',
    'Do not return markdown.',
    'Do not return code fences.',
    'Do not return explanations before or after the JSON.',
    `Today is ${today}.`,
    `Selected page: ${JSON.stringify(selectedPage)}.`,
    `Available pages (first 50): ${JSON.stringify(availablePages)}.`,
    'Interpret the user request and return this exact JSON shape:',
    '{"intent":"","confidence":0,"humanResponse":"","actions":[],"needsClarification":false,"clarificationQuestion":""}',
    'Each action must use this shape:',
    '{"type":"","title":"","icon":"","blocks":[],"pageId":"","parentId":"","parentType":"","query":"","properties":{}}',
    'Allowed block types: paragraph, heading_1, heading_2, heading_3, bulleted_list_item, numbered_list_item, to_do, divider, code, quote, callout.',
    'Use actions only when a Notion operation should happen.',
    'If the request is ambiguous, set needsClarification to true and ask one concise clarificationQuestion.',
    `User message: ${userMessage}`,
  ].join('\n')
}

function stripMarkdownFences(rawOutput) {
  const text = String(rawOutput || '').trim()

  if (text.startsWith('```')) {
    return text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
  }

  return text
}

function extractFirstJsonObject(rawOutput) {
  const text = stripMarkdownFences(rawOutput)
  const start = text.indexOf('{')

  if (start === -1) {
    throw new Error('Gemini output did not contain a JSON object.')
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }

      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  throw new Error('Gemini output contained incomplete JSON.')
}

function parseGeminiResponse(rawOutput) {
  const jsonText = extractFirstJsonObject(rawOutput)
  return JSON.parse(jsonText)
}

function resolveCommand(commandName) {
  if (process.platform === 'win32') {
    return `${commandName}.cmd`
  }

  return commandName
}

function runCli(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: true,
      ...options,
    })

    let stdout = ''
    let stderr = ''
    let didTimeout = false

    const timeout = setTimeout(() => {
      didTimeout = true
      child.kill('SIGTERM')
    }, GEMINI_TIMEOUT_MS)

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    child.on('close', (code) => {
      clearTimeout(timeout)

      if (didTimeout) {
        reject(new Error('Gemini CLI timed out after 30 seconds.'))
        return
      }

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Gemini CLI exited with code ${code}.`))
        return
      }

      resolve(stdout.trim())
    })
  })
}

async function spawnGeminiWithFallback(prompt, env = {}) {
  const cliArgs = ['-p', prompt]

  try {
    return await runCli(resolveCommand('gemini'), cliArgs, {
      env: {
        ...process.env,
        ...env,
      },
    })
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }

    return runCli(
      resolveCommand('npx'),
      ['@google/gemini-cli', '--prompt', prompt],
      {
        env: {
          ...process.env,
          ...env,
        },
      },
    )
  }
}

async function runGeminiCommand(userMessage, context = {}) {
  if (!userMessage || !String(userMessage).trim()) {
    throw new Error('userMessage is required.')
  }

  const prompt = buildSystemPrompt(String(userMessage).trim(), context)
  const apiKey = context.apiKey || context.geminiApiKey || ''
  const rawOutput = await spawnGeminiWithFallback(prompt, {
    GEMINI_API_KEY: apiKey || process.env.GEMINI_API_KEY || '',
    GOOGLE_API_KEY: apiKey || process.env.GOOGLE_API_KEY || '',
  })

  return parseGeminiResponse(rawOutput)
}

const exported = {
  runGeminiCommand,
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exported
}

export { runGeminiCommand }
export default exported
