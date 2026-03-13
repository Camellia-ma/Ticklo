import { ipcMain, app } from 'electron'

export function registerAppIpc() {
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion()
    }
  })

  ipcMain.handle('set-auto-launch', (event, enable) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
      })
      return { success: true, enabled: enable }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('get-motto', async () => {
    try {
      const sources = [
        'https://api.lolimi.cn/API/wryl/api?type=json',
        'https://v1.hitokoto.cn/?encode=json'
      ]
  
      for (const url of sources) {
        try {
          const response = await fetch(url)
          if (!response.ok) continue
          
          const data = await response.json()
          
          if (data.text) return data
          if (data.hitokoto) return { text: data.hitokoto }
        } catch (e) {
          // Ignore fetch errors
        }
      }
      
      throw new Error('All sources failed')
    } catch (e) {
      return { text: '心之所向，素履以往。' }
    }
  })
}
