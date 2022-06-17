import React, { useState, useEffect } from 'react'
import produce from 'immer'
import YAML from 'yaml'

import './App.css'
import { BossProps, Layout, Layouts, getGridCoordinates } from './Layouts'
import { Boss, Bosses } from './Bosses'
import BossIcon from './BossIcon'
import initAutosplitterHook from './AutosplitterHook'
import { version } from './../package.json'

// 'electron-store' bugs out for me, and it's a general overkill for this app
import Store from './simpleStore'
const store = new Store('uiState.json')

function App() {
  // correctly works with bool props and zeroes
  const getProp = (store: Store, propName: any, defaultProp: any) => {
    const storeProp = store.get(propName)
    if (typeof storeProp === 'undefined') {
      return defaultProp
    } else {
      return storeProp
    }
  }

  // state
  const defaultCurrentLayoutId = 'hexV'
  const [currentLayoutId, setCurrentLayoutId] = useState<string>(getProp(store, 'currentLayoutId', defaultCurrentLayoutId))
  const [bosses, setBosses] = useState<Bosses>()
  const [showOnlyBossIcons, setShowOnlyBossIcons] = useState<boolean>(getProp(store, 'showOnlyBossIcons', false))
  const [aphb, setAphb] = useState<boolean>(getProp(store, 'aphb', false))
  const [ab, setAb] = useState<boolean>(getProp(store, 'ab', true))

  const defaultScale = 1.5
  const layoutsOverrideForScale = store.get('layoutsOverrides') && store.get('layoutsOverrides')[currentLayoutId]?.scale
  const [scale, setScale] = useState<number>(layoutsOverrideForScale || defaultScale)

  const [keyColorHex, setKeyColorHex] = useState<string>(getProp(store, 'keyColorHex', '#222222'))
  const [gridMinX, setGridMinX] = useState<number>(0)
  const [gridMinY, setGridMinY] = useState<number>(0)

  const defaultGridUnitSize = 40
  const layoutsOverrideForGridUnitSize = store.get('layoutsOverrides') && store.get('layoutsOverrides')[currentLayoutId]?.gridUnitSize
  const [gridUnitSize, setGridUnitSize] = useState<number>(layoutsOverrideForGridUnitSize || defaultGridUnitSize)

  const defaultAnimationsCooldown = 0
  const [animationsCooldown, setAnimationsCooldown] = useState<number>(getProp(store, 'animationsCooldown', defaultAnimationsCooldown))
  const [autosplitterHookFilePath, setAutosplitterHookFilePath] = useState<string>(getProp(store, 'autosplitterHookFilePath', ''))
  const [layouts, setLayouts] = useState<Layouts>({})

  // side effects
  useEffect(() => {
    // NOTE: using immerjs for nested objects here and below so simpleStore could easilly compare old value and new one.
    if (bosses) {
      let iconVariants: { [key: string]: number } = store.get('iconVariants')
      if (!iconVariants) {
        iconVariants = {}
      }
      const bossList: Array<string> = Object.keys(bosses)
      bossList.forEach((bossName) => {
        const boss = bosses[bossName]
        if (boss.iconPaths.length > 1) {
          iconVariants = produce(iconVariants, draft => { draft[bossName] = boss.currentIconVariant })
        }
      })
      store.set('iconVariants', iconVariants)
    }

    store.set('aphb', aphb)
    store.set('ab', ab)
    store.set('showOnlyBossIcons', showOnlyBossIcons)
    store.set('animationsCooldown', animationsCooldown)
    store.set('keyColorHex', keyColorHex)
    store.set('currentLayoutId', currentLayoutId)
    store.set('autosplitterHookFilePath', autosplitterHookFilePath)
  }, [bosses, aphb, ab, showOnlyBossIcons, animationsCooldown, keyColorHex, currentLayoutId, autosplitterHookFilePath])

  // saving scale and gridUnitSize separate from other props because otherwise
  //   changing currentLayoutId triggers saving wrong data to the store
  useEffect(() => {
    let layoutsOverrides: { [key: string]: { scale?: number, gridUnitSize?: number }} = store.get('layoutsOverrides')
    if (!layoutsOverrides) {
      layoutsOverrides = {}
    }
    if (!layoutsOverrides[currentLayoutId]) {
      layoutsOverrides = produce(layoutsOverrides, draft => { draft[currentLayoutId] = {}})
    }
    layoutsOverrides = produce(layoutsOverrides, draft => {
      draft[currentLayoutId].scale = scale
      draft[currentLayoutId].gridUnitSize = gridUnitSize
    })
    store.set('layoutsOverrides', layoutsOverrides)

    // should not trigger saving scale and such to the store if currentLayoutId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, gridUnitSize])

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
      fileNames = fileNames.filter(fileName => {
        return path.extname(fileName).toLowerCase() === '.yaml';
      })
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
        const layout: Layout = YAML.parse(data)
        const id: string = path.parse(fileName).name
        layoutsInitialState[id] = layout
      }

      setLayouts(layoutsInitialState)

      // NOTE: test case: create layout file, select it, rename file => currentLayout === undefined.
      // REVIEW: this fails if there's no hexV layout in the folder for some reason, need fix?
      if (!layoutsInitialState[currentLayoutId]) {
        setCurrentLayoutId(defaultCurrentLayoutId)
      }
    }

    initializeLayouts()

    // should run once, don't need to check whether currentLayoutId changed or not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const path = require('path')
    const bossIconsDir = 'assets/boss-icons'
    const bossIconsScanDir = path.format({ root: './public/', base: bossIconsDir })

    async function initializeBosses() {
      const fs = require('fs')
      let fileNames: Array<string>
      try {
        fileNames = await fs.promises.readdir(bossIconsScanDir)
      } catch (err) {
        return
      }
      if (fileNames.length === 0) {
        return
      }

      let parsedIconsData: any = {}
      fileNames.forEach(fileName => {
        const fileNameNoExt: string = path.parse(fileName).name
        const match = fileNameNoExt.match(/^([^-]+)(-v([^-]+))?(-a)?(\d+)?$/)
        if (!match) {
          return
        }

        const bossName = match[1]
        const bossIconVariant = match[3] || 'default'
        const bossIconAnimated = (match[4] === '-a')
        const bossIconAnimationDuration = parseInt(match[5])

        if (!parsedIconsData[bossName]) {
          parsedIconsData[bossName] = {}
        }

        if (!parsedIconsData[bossName][bossIconVariant]) {
          parsedIconsData[bossName][bossIconVariant] = {}
        }

        const fullIconPath = path.join(bossIconsDir, fileName)
        if (bossIconAnimated) {
          parsedIconsData[bossName][bossIconVariant].animatedPath = fullIconPath
          parsedIconsData[bossName][bossIconVariant].bossIconAnimationDuration = bossIconAnimationDuration
        } else {
          parsedIconsData[bossName][bossIconVariant].regularPath = fullIconPath
        }
      })

      let bossesInitialState: any = {}
      Object.keys(parsedIconsData).forEach(bossName => {
        const boss: Boss = {
          defeated: false,
          hardmodeExclusive: true,
          requiredForMl: false,
          currentIconVariant: 0,
          iconPaths: [],
        }

        Object.keys(parsedIconsData[bossName]).forEach(iconVariant => {
          const paths = {
            regular: parsedIconsData[bossName][iconVariant].regularPath,
            animated : parsedIconsData[bossName][iconVariant].animatedPath,
            animationDuration: parsedIconsData[bossName][iconVariant].bossIconAnimationDuration,
          }
          boss.iconPaths.push(paths)
        })

        bossesInitialState[bossName] = boss
      })

      // TODO: let users est aphb flag somewhere somehow. Hardcoded phb for now.
      const aphbList: Array<string> = ['ks', 'eoc', 'evil', 'qb', 'skeletron', 'dc', 'wof']
      aphbList.forEach(bossName => {
        if (bossesInitialState[bossName]) {
          bossesInitialState[bossName].hardmodeExclusive = false
        }
      })

      const abList: Array<string> = [
        'wof', 'destroyer', 'twins', 'prime', 'skeletron',
        'plantera', 'golem', 'cultist', 'pillars', 'ml'
      ]
      abList.forEach(bossName => {
        if (bossesInitialState[bossName]) {
          bossesInitialState[bossName].requiredForMl = true
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

  useEffect(() => { document.body.style.backgroundColor = keyColorHex }, [keyColorHex])

  useEffect(() => {
    let tmpX = Infinity, tmpY = Infinity

    const layout = layouts[currentLayoutId]
    if (!layout) {
      return
    }

    layout.bosses.forEach((bossProps: BossProps) => {
      let x, y
      const layoutType = layout.type

      // NOTE: if you swap this other way around ts won't compile despite this being the same code, funny.
      if (layoutType !== 'cartesian') {
        ({ x, y } = getGridCoordinates({
          layoutType,
          i: bossProps.i,
          j: bossProps.j,
          gridUnitSize,
        }))
      } else {
        [x, y] = [bossProps.x, bossProps.y]
      }
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

  // use layouts' scale and gridUnitSize unless it there are overrides in uiState
  useEffect(() => {
    const currentLayout = layouts[currentLayoutId]

    const layoutsOverrideForScale = store.get('layoutsOverrides')[currentLayoutId]?.scale
    if (layoutsOverrideForScale) {
      setScale(layoutsOverrideForScale)
    } else if (currentLayout && currentLayout.scale) {
      setScale(currentLayout.scale)
    }

    const layoutsOverrideForGridUnitSize = store.get('layoutsOverrides')[currentLayoutId]?.gridUnitSize
    if (layoutsOverrideForGridUnitSize) {
      setGridUnitSize(layoutsOverrideForGridUnitSize)
    } else if (currentLayout && currentLayout.gridUnitSize) {
      setGridUnitSize(currentLayout.gridUnitSize)
    }
  }, [layouts, currentLayoutId])

  // event handlers
  // REVIEW: should all handlers, even that simple, be outside of html?
  const handleShowOnlyBossIconsClick = (): void => {
    setShowOnlyBossIcons(!showOnlyBossIcons)
  }

  const handleAphbClick = (): void => {
    setAphb(!aphb)
  }

  const handleAbClick = (): void => {
    setAb(!ab)
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

  // REVIEW: it might be the time to make a general function for this handler's type,
  //   this pattern used 3 times already.
  const handleChangeAnimationsCooldown = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    let nextAnimationsCooldown = parseFloat(elem.value)
    if (isNaN(nextAnimationsCooldown)) {
      setAnimationsCooldown(defaultAnimationsCooldown)
    } else {
      setAnimationsCooldown(nextAnimationsCooldown)
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
    setBosses(produce(bosses, draft => {
      // NOTE: at this point I'm sure draft (aka proxy dor bosses) is defined.
      draft![bossName].defeated = !(draft![bossName].defeated)
    }))
  }

  const handleBossIconRightClick = (bossName: string): void => {
    const boss = bosses![bossName]
    if (boss.iconPaths.length > 1) {
      let nextIconVariant = boss.currentIconVariant + 1
      if (nextIconVariant > boss.iconPaths.length - 1) {
        nextIconVariant = 0
      }

      setBosses(produce(bosses, draft => {
        draft![bossName].currentIconVariant = nextIconVariant
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
    <div id="buttons">
      <button onClick={handleShowOnlyBossIconsClick}>
        {showOnlyBossIcons ? 'show settings' : 'hide settings'}
      </button>
      <button onClick={() => {
        store.reset()
        const { getCurrentWindow } = require('@electron/remote')
        getCurrentWindow().reload()
      }}>
        reset settings
      </button>
      <button onClick={() => {
        const { shell, app } = require('@electron/remote')
        if (app.isPackaged) {
          // https://stackoverflow.com/a/64149465
          const path = require('path')
          const exeDirPath = path.dirname(app.getPath('exe'))
          shell.openPath(exeDirPath)
        } else {
          // https://stackoverflow.com/a/37215237
          shell.openPath(app.getAppPath())
        }
      }}>
        open app folder
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
      <div>
        <label htmlFor="settings-ab-checkbox" className="pointer">
          <span>show only bosses required for Moon Lord:</span>
        </label>
        <input
          id="settings-ab-checkbox"
          type="checkbox"
          defaultChecked={!ab}
          onChange={handleAbClick}
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
          disabled={currentLayout && currentLayout.type === 'cartesian'}
        />
        <input type="number" min="0"
          value={gridUnitSize}
          onChange={handleChangeGridUnitSize}
          disabled={currentLayout && currentLayout.type === 'cartesian'}
        />
      </div>
      {false && <div id="settings-animation-cd">
        <span>animations cooldown<br />(in minutes, 0 = none):</span>
        <input type="range" min="0" max="60" step="5"
          value={animationsCooldown}
          onChange={handleChangeAnimationsCooldown}
        />
        <input type="number" step="1" min="0"
          value={animationsCooldown}
          onChange={handleChangeAnimationsCooldown}
        />
      </div>}
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
        <label title={autosplitterHookFilePath ? autosplitterHookFilePath : 'file not selected'}>
          <input type="file" onChange={handleChangeHookFilePath} />
          {autosplitterHookFilePath ? '✔ file selected' : 'select file'}
        </label>
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
        if (typeof aphb === 'boolean' && aphb && boss.hardmodeExclusive) {
          return false
        }

        if (typeof ab === 'boolean' && !ab && !boss.requiredForMl) {
          return false
        }

        let useIconVariants = false
        if (boss.iconPaths.length > 1) {
          useIconVariants = true
        }

        return <BossIcon
          key={`${bossProps.bossName}-wrapper`}
          bossProps={bossProps}
          regularPath={boss.iconPaths[boss.currentIconVariant].regular}
          animatedPath={boss.iconPaths[boss.currentIconVariant].animated}
          animationDuration={boss.iconPaths[boss.currentIconVariant].animationDuration}
          defeated={boss.defeated}
          useIconVariants={useIconVariants}
          layoutType={currentLayout.type}
          gridUnitSize={gridUnitSize}
          animationsCooldown={animationsCooldown}
          leftClickHandler={handleBossIconLeftClick}
          rightClickHandler={handleBossIconRightClick}
        />
      })}
    </div>
    <div style={{position: 'absolute', bottom: '20px', right: '20px', color: 'gray'}}>v{version}</div>
  </div>
}

export default App
