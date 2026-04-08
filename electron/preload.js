import { contextBridge, ipcRenderer } from 'electron'

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload)

contextBridge.exposeInMainWorld('autonotion', {
  getAppInfo: () => invoke('app:get-info'),
  getSettings: () => invoke('settings:get'),
  saveSettings: (settings) => invoke('settings:save', settings),
  runHealthCheck: (settings) => invoke('settings:health-check', settings),
})
