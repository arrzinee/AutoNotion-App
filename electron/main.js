import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  shell,
} from 'electron'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const NOTION_VERSION = '2022-06-28'
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash'

let store

function getStoreEncryptionKey() {
  const rawKey = `${app.getName()}:${app.getPath('userData')}:autonotion`

  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(rawKey).toString('base64')
  }

  return rawKey
}

async function initStore() {
  if (store) {
    return store
  }

  const { default: Store } = await import('electron-store')

  store = new Store({
    name: 'autonotion-store',
    encryptionKey: getStoreEncryptionKey(),
    defaults: {
      notionToken: '',
      notionDatabaseId: '',
      geminiApiKey: '',
      geminiModel: DEFAULT_GEMINI_MODEL,
    },
  })

  return store
}

async function getStore() {
  return initStore()
}

async function getStoredValue(key, fallback = '') {
  const activeStore = await getStore()

  return activeStore.get(key, fallback)
}

function getWindowOptions() {
  return {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    title: 'AutoNotion',
    titleBarStyle: 'hidden',
    ...(isWindows
      ? {
          titleBarOverlay: {
            color: '#0a0a0f',
            symbolColor: '#6366f1',
          },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  }
}

async function createMainWindow() {
  const mainWindow = new BrowserWindow(getWindowOptions())

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return mainWindow
}

async function notionRequest(endpoint, { method = 'GET', body } = {}) {
  const notionToken = await getStoredValue('notionToken')

  if (!notionToken) {
    throw new Error('Missing Notion token in secure storage.')
  }

  const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || 'Notion request failed.')
  }

  return payload
}

async function fetchNotionPages(payload = {}) {
  const databaseId =
    payload.databaseId || (await getStoredValue('notionDatabaseId'))

  if (!databaseId) {
    throw new Error('Missing Notion database ID in secure storage.')
  }

  return notionRequest(`databases/${databaseId}/query`, {
    method: 'POST',
    body: payload.query || {},
  })
}

async function createNotionPage(payload = {}) {
  const databaseId =
    payload.databaseId || (await getStoredValue('notionDatabaseId'))

  if (!databaseId) {
    throw new Error('Missing Notion database ID in secure storage.')
  }

  return notionRequest('pages', {
    method: 'POST',
    body: {
      parent: {
        database_id: databaseId,
      },
      ...payload,
      databaseId: undefined,
    },
  })
}

async function updateNotionPage(payload = {}) {
  if (!payload.pageId) {
    throw new Error('updatePage requires a pageId.')
  }

  const { pageId, ...body } = payload

  return notionRequest(`pages/${pageId}`, {
    method: 'PATCH',
    body,
  })
}

async function appendNotionBlocks(payload = {}) {
  if (!payload.blockId || !Array.isArray(payload.children)) {
    throw new Error('appendBlocks requires blockId and children.')
  }

  return notionRequest(`blocks/${payload.blockId}/children`, {
    method: 'PATCH',
    body: {
      children: payload.children,
    },
  })
}

async function searchNotion(payload = {}) {
  return notionRequest('search', {
    method: 'POST',
    body: payload,
  })
}

async function runGemini(payload = {}) {
  const geminiApiKey =
    payload.apiKey || (await getStoredValue('geminiApiKey'))
  const geminiModel =
    payload.model || (await getStoredValue('geminiModel', DEFAULT_GEMINI_MODEL))

  if (!geminiApiKey) {
    throw new Error('Missing Gemini API key in secure storage.')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: payload.contents || [],
        generationConfig: payload.generationConfig,
        safetySettings: payload.safetySettings,
        systemInstruction: payload.systemInstruction,
        tools: payload.tools,
      }),
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed.')
  }

  return data
}

function registerIpcHandlers() {
  ipcMain.handle('store:get', async (_, key, fallback) => {
    const activeStore = await getStore()
    return activeStore.get(key, fallback ?? null)
  })

  ipcMain.handle('store:set', async (_, key, value) => {
    const activeStore = await getStore()
    activeStore.set(key, value)
    return true
  })

  ipcMain.handle('store:delete', async (_, key) => {
    const activeStore = await getStore()
    activeStore.delete(key)
    return true
  })

  ipcMain.handle('notion:fetchPages', async (_, payload) => fetchNotionPages(payload))
  ipcMain.handle('notion:createPage', async (_, payload) => createNotionPage(payload))
  ipcMain.handle('notion:updatePage', async (_, payload) => updateNotionPage(payload))
  ipcMain.handle('notion:appendBlocks', async (_, payload) =>
    appendNotionBlocks(payload),
  )
  ipcMain.handle('notion:search', async (_, payload) => searchNotion(payload))

  ipcMain.handle('gemini:run', async (_, payload) => runGemini(payload))

  ipcMain.handle('shell:openExternal', async (_, target) => {
    await shell.openExternal(target)
    return true
  })
}

app.whenReady().then(async () => {
  await initStore()
  registerIpcHandlers()
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})
