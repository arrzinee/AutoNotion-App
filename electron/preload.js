import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key, fallback) => ipcRenderer.invoke('store:get', key, fallback),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  notion: {
    fetchPages: (payload) => ipcRenderer.invoke('notion:fetchPages', payload),
    createPage: (payload) => ipcRenderer.invoke('notion:createPage', payload),
    updatePage: (payload) => ipcRenderer.invoke('notion:updatePage', payload),
    appendBlocks: (payload) =>
      ipcRenderer.invoke('notion:appendBlocks', payload),
    search: (payload) => ipcRenderer.invoke('notion:search', payload),
  },
  gemini: {
    run: (userMessage, context) =>
      ipcRenderer.invoke('gemini:run', userMessage, context),
  },
  shell: {
    openExternal: (target) => ipcRenderer.invoke('shell:openExternal', target),
  },
})
