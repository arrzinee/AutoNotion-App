import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  shell,
} from 'electron'
import {
  appendNotionBlocks,
  createNotionPage,
  fetchNotionPages,
  searchNotion,
  updateNotionPage,
} from './notion.js'
import { runGeminiCommand } from './gemini.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let store

function getStoreEncryptionKey() {
  return 'autonotion-local-key-2024'
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
      geminiModel: 'gemini-1.5-flash',
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

  ipcMain.handle('notion:fetchPages', async () => {
    const apiKey = await getStoredValue('notionToken')
    return fetchNotionPages(apiKey)
  })

  ipcMain.handle('notion:createPage', async (_, payload) => {
    const apiKey = await getStoredValue('notionToken')
    return createNotionPage(apiKey, payload)
  })

  ipcMain.handle('notion:updatePage', async (_, payload) => {
    const apiKey = await getStoredValue('notionToken')
    return updateNotionPage(apiKey, payload?.pageId, payload)
  })

  ipcMain.handle('notion:appendBlocks', async (_, payload) => {
    const apiKey = await getStoredValue('notionToken')
    return appendNotionBlocks(apiKey, payload?.pageId, payload?.blocks)
  })

  ipcMain.handle('notion:search', async (_, payload) => {
    const apiKey = await getStoredValue('notionToken')
    return searchNotion(apiKey, payload?.query || '')
  })

  ipcMain.handle('gemini:run', async (_, userMessage, context) => {
    const apiKey = await getStoredValue('geminiApiKey')
    const notionApiKey = await getStoredValue('notionToken')
    const availablePages =
      context?.pages?.slice?.(0, 50) ||
      (await fetchNotionPages(notionApiKey).catch(() => []))

    return runGeminiCommand(userMessage, {
      ...context,
      apiKey,
      availablePages,
    })
  })

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
