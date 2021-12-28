const electron = require('electron')
const { app, BrowserWindow } = electron

const path = require('path')

const windowStateKeeper = require('electron-window-state')

let mainWindow

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 680,
    defaultHeight: 680
  })

  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: __dirname + '/favicon.ico',
  })
  mainWindowState.manage(mainWindow)
  // mainWindow.removeMenu()
  mainWindow.loadURL(!app.isPackaged ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)
  if (!app.isPackaged) {
    // Open the DevTools.
    // BrowserWindow.addDevToolsExtension('<location to your react chrome extension>')
    mainWindow.webContents.openDevTools()
  }
  mainWindow.on('closed', () => { mainWindow = null })

  require('@electron/remote/main').initialize()
  require("@electron/remote/main").enable(mainWindow.webContents)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
