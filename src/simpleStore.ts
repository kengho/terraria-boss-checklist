const fs = require('fs')

class SimpleStore {
  storageFilePath: string

  currentState: { [key: string]: any }

  constructor(storageFilePath: string) {
    this.storageFilePath = storageFilePath
    if (!fs.existsSync(storageFilePath)) {
      fs.appendFileSync(storageFilePath, '{}')
    }

    // REVIEW: error handleling? never heard of it
    // REVIEW: it there a possibility for 'currentState' and data in 'storageFilePath' to desync?
    //   The first review of this class came with file reading in 'get', but I got rid of it eventually,
    //   introducing 'currentState', but I can't stop to wonder was that a mistake.
    this.currentState = JSON.parse(fs.readFileSync(this.storageFilePath, 'utf-8'))
  }

  get(key: any): any {
    return this.currentState[key]
  }

  set(key: any, value: any): void {
    if (this.currentState[key] !== value) {
      this.currentState[key] = value
      fs.writeFileSync(this.storageFilePath, JSON.stringify(this.currentState, null, 4))
    }
  }
}

export default SimpleStore
