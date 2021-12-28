import React, { useState, useEffect } from 'react'
import produce from 'immer'

import './App.css'
import { BossProps, Layout, Layouts, getGridCoordinates } from './Layouts'
import { Boss, Bosses } from './Bosses'
import initAutosplitterHook from './AutosplitterHook'
import { version, description } from './../package.json'

// 'electron-store' bugs out for me, and it's a general overkill for this app
import Store from './simpleStore'
const store = new Store('uiState.json')

function App() {
  // state
  const [bosses, setBosses] = useState<Bosses>()
  const [showOnlyBossIcons, setShowOnlyBossIcons] = useState<boolean>(store.get('showOnlyBossIcons') || false)
  const [aphb, setAphb] = useState<boolean>(store.get('aphb') || false)
  const defaultScale = 1.5
  const [scale, setScale] = useState<number>(store.get('scale') || defaultScale)
  const [keyColorHex, setKeyColorHex] = useState<string>(store.get('keyColorHex') || '#222222')
  const [gridMinX, setGridMinX] = useState<number>(0)
  const [gridMinY, setGridMinY] = useState<number>(0)
  const defaultGridUnitSize = 40
  const [gridUnitSize, setGridUnitSize] = useState<number>(store.get('gridUnitSize') || defaultGridUnitSize)
  const [autosplitterHookFilePath, setAutosplitterHookFilePath] = useState<string>(store.get('autosplitterHookFilePath') || '')
  const [layouts, setLayouts] = useState<Layouts>({})
  const defaultCurrentLayoutId = 'hexV'
  const [currentLayoutId, setCurrentLayoutId] = useState<string>(store.get('currentLayoutId') || defaultCurrentLayoutId)

  // side effects
  useEffect(() => {
    let iconVariants: { [key: string]: number } = {}
    if (bosses) {
      const bossList: Array<string> = Object.keys(bosses)
      bossList.forEach((bossName) => {
        const boss = bosses[bossName]
        if (boss.iconPaths.length > 1) {
          iconVariants[bossName] = boss.currentIconVariant
        }
      })
      store.set('iconVariants', iconVariants)
    }

    // TODO: aphb hardcoded into layouts for now, fix.
    store.set('aphb', aphb)
    store.set('scale', scale)
    store.set('showOnlyBossIcons', showOnlyBossIcons)
    store.set('keyColorHex', keyColorHex)
    store.set('currentLayoutId', currentLayoutId)
    store.set('gridUnitSize', gridUnitSize)
    store.set('autosplitterHookFilePath', autosplitterHookFilePath)
  }, [bosses, aphb, scale, showOnlyBossIcons, keyColorHex, currentLayoutId, gridUnitSize, autosplitterHookFilePath])

  useEffect(() => {
    const layoutsDir = './public/assets/layouts'

    async function initializeLayouts() {
      const fs = require('fs')
      const path = require('path')
      let fileNames: Array<string>
      try {
        fileNames = await fs.promises.readdir(layoutsDir)
      } catch (err) {
        return
      }
      if (fileNames.length === 0) {
        return
      }

      let layoutsInitialState: Layouts = {}
      for (const fileName of fileNames) {
        let data: string
        try {
          data  = await fs.promises.readFile(path.join(layoutsDir, fileName), 'utf-8')
        } catch (err) {
          return
        }

        // TODO: handle errors, enforce data check.
        const layout: Layout = JSON.parse(data)
        const id: string = path.parse(fileName).name
        layoutsInitialState[id] = layout
      }

      setLayouts(layoutsInitialState)

      // NOTE: test case: create layout file, select it, rename file => currentLayout === undefined.
      if (!layoutsInitialState[currentLayoutId]) {
        setCurrentLayoutId(defaultCurrentLayoutId)
      }
    }

    initializeLayouts()
  }, [])

  useEffect(() => {
    const bossIconsDir = './public/assets/boss-icons'

    // NOTE: images rendering with "public" as root.
    const bossIconsRenderDir = './assets/boss-icons'

    async function initializeBosses() {
      const fs = require('fs')
      const path = require('path')
      let fileNames: Array<string>
      try {
        fileNames = await fs.promises.readdir(bossIconsDir)
      } catch (err) {
        return
      }
      if (fileNames.length === 0) {
        return
      }

      let bossesInitialState: any = {}
      fileNames.forEach(fileName => {
        const fileNameNoExt: string = path.parse(fileName).name
        const match = fileNameNoExt.match(/^([^-]+)(-v.*)?$/)
        if (!match) {
          return
        }

        const bossName = match[1]
        if (!bossesInitialState[bossName]) {
          const boss: Boss = {
            defeated: false,
            hardmodeExclusive: true,
            currentIconVariant: 0,
            iconPaths: [],
          }
          bossesInitialState[bossName] = boss
        }

        const fullIconPath = path.join(bossIconsRenderDir, fileName)

        // NOTE: I'm sure it's defined.
        bossesInitialState[bossName]!.iconPaths.push(fullIconPath)
      })

      // TODO: let users est aphb flag somewhere somehow. Hardcoded phb for now.
      const aphbList: Array<string> = ['ks', 'eoc', 'evil', 'qb', 'skeletron', 'dc', 'wof']
      aphbList.forEach(bossName => {
        if (bossesInitialState[bossName]) {
          bossesInitialState[bossName].hardmodeExclusive = false
        }
      })

      // restore icon variants upon load
      const storedIconVariants: { [key: string]: number } = store.get('iconVariants')
      if (storedIconVariants) {
        Object.keys(storedIconVariants).forEach(bossName => {
          bossesInitialState[bossName].currentIconVariant = storedIconVariants[bossName]
        })
      }

      setBosses(bossesInitialState)
    }

    initializeBosses()
  }, [])

  useEffect(() => {
    initAutosplitterHook(autosplitterHookFilePath, setBosses)
  }, [autosplitterHookFilePath])

  useEffect(() => { document.title = `${description} ${version}` }, [])

  useEffect(() => { document.body.style.backgroundColor = keyColorHex }, [keyColorHex])

  useEffect(() => {
    let tmpX = Infinity, tmpY = Infinity

    const layout = layouts[currentLayoutId]
    if (!layout) {
      return
    }

    layouts[currentLayoutId].bosses.forEach((bossProps: BossProps) => {
      const { x, y } = getGridCoordinates({
        layoutType: layouts[currentLayoutId].type,
        i: bossProps.i,
        j: bossProps.j,
        gridUnitSize,
      })
      if (x < tmpX) {
        tmpX = x
      }
      if (y < tmpY) {
        tmpY = y
      }
    })
    setGridMinX(tmpX)
    setGridMinY(tmpY)
  }, [layouts, currentLayoutId, gridUnitSize])

  useEffect(() => {
    const currentLayout = layouts[currentLayoutId]
    if (currentLayout && currentLayout.scale) {
      setScale(currentLayout.scale)
    }
    if (currentLayout && currentLayout.gridUnitSize) {
      setGridUnitSize(currentLayout.gridUnitSize)
    }
  }, [layouts, currentLayoutId])

  // event handlers
  const handleShowOnlyBossIconsClick = (): void => {
    setShowOnlyBossIcons(!showOnlyBossIcons)
  }

  const handleAphbClick = (): void => {
    setAphb(!aphb)
  }

  const handleChangeScale = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    let nextScale = parseFloat(elem.value)
    if (isNaN(nextScale)) {
      setScale(defaultScale)
    } else {
      setScale(nextScale)
    }
  }

  const handleChangeGridUnitSize = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    let nextGridUnitSize = parseInt(elem.value)
    if (isNaN(nextGridUnitSize)) {
      setGridUnitSize(defaultGridUnitSize)
    } else {
      setGridUnitSize(nextGridUnitSize)
    }
  }

  const handleChangeKeyColorHex = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    setKeyColorHex(elem.value)
  }

  const handleChangecurrentLayoutId = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    setCurrentLayoutId(elem.value as string)
  }

  const handleBossIconLeftClick = (bossName: string): void => {
    setBosses(produce(draft => {
      // REVIEW
      if (!draft) {
        return
      }

      draft[bossName].defeated = !draft[bossName].defeated
    }))
  }

  const handleBossIconRightClick = (bossName: string): void => {
    const boss = bosses![bossName]
    if (boss.iconPaths.length > 1) {
      let nextIconVariant = boss.currentIconVariant + 1
      if (nextIconVariant > boss.iconPaths.length - 1) {
        nextIconVariant = 0
      }

      setBosses(produce(draft => {
        // REVIEW
        if (!draft) {
          return
        }

        draft[bossName].currentIconVariant = nextIconVariant
      }))
    }
  }

  const handleChangeHookFilePath = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    const file = elem.files![0] as any
    if (file && (typeof file.path === 'string')) {
      setAutosplitterHookFilePath(file.path)
    }
  }

  // main html
  const currentLayout = layouts[currentLayoutId]
  return <div id="checklist">
    <div id="show-only-boss-icons">
      <button onClick={handleShowOnlyBossIconsClick}>
        {showOnlyBossIcons ? 'show settings' : 'hide settings'}
      </button>
    </div>
    <div id="tips" style={{ display: showOnlyBossIcons ? 'none' : 'block' }}>
      <ul>
        <li><span>left click on the boss marks it as defeated</span></li>
        <li><span>right click on the boss changes icon's variant wherever available (note the cursor style)</span></li>
      </ul>
    </div>
    <div id="settings" style={{ display: showOnlyBossIcons ? 'none' : 'block' }}>
      <div>
        <label htmlFor="settings-aphb-checkbox" className="pointer">
          <span>show only pre-hardmode bosses:</span>
        </label>
        <input
          id="settings-aphb-checkbox"
          type="checkbox"
          defaultChecked={aphb}
          onChange={handleAphbClick}
        />
      </div>
      <div id="settings-scale">
        <span>scale:</span>
        <input type="range" min="0.5" max="4" step="0.1"
          value={scale}
          onChange={handleChangeScale}
        />
        <input type="number" step="0.1" min="0"
          value={scale}
          onChange={handleChangeScale}
        />
      </div>
      <div id="settings-grid-unit-size">
        <span>grid unit size:</span>
        <input type="range" min="30" max="50" step="1"
          value={gridUnitSize}
          onChange={handleChangeGridUnitSize}
        />
        <input type="number" min="0"
          value={gridUnitSize}
          onChange={handleChangeGridUnitSize}
        />
      </div>
      <div id="settings-bgcolor">
        <span>key color:</span>
        <input type="text" pattern="[#0-9a-f]+"
          onChange={handleChangeKeyColorHex}
          value={keyColorHex}
        />
      </div>
      {currentLayout &&
        <div id="settings-grid-type">
          <span>layout:</span>
          <select
            key={`settings-layouts-select-${currentLayoutId}`}
            defaultValue={currentLayoutId}
            onChange={handleChangecurrentLayoutId}
          >
          {Object.keys(layouts).map((id) =>
            <option key={`settings-layouts-option-${id}`} value={id}>{layouts[id].alias}</option>
          )}
          </select>
        </div>
      }
      <div id="settings-hook-file-path">
        <span>autosplitter hook file:</span>
        <input type="file" onChange={handleChangeHookFilePath} />
      </div>
    </div>
    <div
      id="boss-icons"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${gridMinX - gridUnitSize / 2}px ${gridMinY - gridUnitSize / 2}px`,
        top: `${-gridMinY + gridUnitSize}px`,
        left: `${-gridMinX + gridUnitSize}px`,
      }}
    >
      {currentLayout && currentLayout.bosses && currentLayout.bosses.map((bossProps: BossProps) => {
        const boss = bosses![bossProps.bossName]
        if (aphb && boss.hardmodeExclusive) {
          return false
        }

        let useIconVariants = false
        if (boss.iconPaths.length > 1) {
          useIconVariants = true
        }

        const imgPath = boss.iconPaths[boss.currentIconVariant]
        const iconClassNames = ['boss-icon-img']
        if (!boss.defeated) {
          iconClassNames.push('boss-undefeated')
        }
        if (useIconVariants) {
          iconClassNames.push('pointer')
        }

        const { x, y } = getGridCoordinates({
          layoutType: currentLayout.type,
          i: bossProps.i,
          j: bossProps.j,
          gridUnitSize,
        })
        return <div
          key={`${bossProps.bossName}-wrapper`}
          className="boss-icon-wrapper"
          style={{
            width: gridUnitSize,
            height: gridUnitSize,
            left: x - gridUnitSize / 2,
            top: y - gridUnitSize / 2,
          }}
        >
          <img
            key={`${bossProps.bossName}-img`}
            alt={bossProps.bossName}
            className={iconClassNames.join(' ')}
            src={imgPath}
            onClick={() => handleBossIconLeftClick(bossProps.bossName)}
            onContextMenu={/* change if not electron */ () => handleBossIconRightClick(bossProps.bossName)}
          />
        </div>
      })}
    </div>
  </div>
}

export default App
