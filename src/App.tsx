import React, { useState, useEffect } from 'react'
import produce from 'immer'

import './App.css'
import { grids, GridType, getGridCoordinates } from './Grid'
import { bossNames, BossName, Bosses } from './Bosses'
import initAutosplitterHook from './AutosplitterHook'
import { version, description } from './../package.json'

// 'electron-store' bugs out for me, and it's a general overkill for this app
import Store from './simpleStore'
const store = new Store('uiState.json')

function App() {
  // state
  // REVIEW: : maybe scan the images before starting the app?
  //   This way we won't need boss names and icon variants hardcoded.
  const bossesInitialState: any = {}
  bossNames.forEach(bossName =>
    bossesInitialState[bossName] = {
      defeated: false,
      hardmodeExclusive: true,
    }
  )
  const aphbList: Array<BossName> = ['ks', 'eoc', 'evil', 'qb', 'skeletron', 'dc', 'wof']
  aphbList.forEach(bossName => {
    bossesInitialState[bossName].hardmodeExclusive = false
  })

  bossesInitialState.eoc.iconVariantsNumber = 2

  // NOTE: I do realize that this only works because default value is 0.
  bossesInitialState.eoc.currentIconVariant = store.get('eocIconVariant') || 0
  bossesInitialState.evil.iconVariantsNumber = 3
  bossesInitialState.evil.currentIconVariant = store.get('evilIconVariant') || 0
  bossesInitialState.dc.iconVariantsNumber = 2
  bossesInitialState.dc.currentIconVariant = store.get('dcIconVariant') || 0
  bossesInitialState.twins.iconVariantsNumber = 6
  bossesInitialState.twins.currentIconVariant = store.get('twinsIconVariant') || 0
  bossesInitialState.plantera.iconVariantsNumber = 2
  bossesInitialState.plantera.currentIconVariant = store.get('planteraIconVariant') || 0
  const [bosses, setBosses] = useState<Bosses>(bossesInitialState)
  const [showOnlyBossIcons, setShowOnlyBossIcons] = useState<boolean>(store.get('showOnlyBossIcons') || false)
  const [aphb, setAphb] = useState<boolean>(store.get('aphb') || false)
  const defaultScale = 1.5
  const [scale, setScale] = useState<number>(store.get('scale') || defaultScale)
  const [keyColorHex, setKeyColorHex] = useState<string>(store.get('keyColorHex') || '#222222')
  const [gridType, setGridType] = useState<GridType>(store.get('gridType') || 'hexV')
  const [gridMinX, setGridMinX] = useState<number>(0)
  const [gridMinY, setGridMinY] = useState<number>(0)
  const defaultGridUnitSize = 40
  const [gridUnitSize, setGridUnitSize] = useState<number>(store.get('gridUnitSize') || defaultGridUnitSize)
  const [autosplitterHookFilePath, setAutosplitterHookFilePath] = useState<string>(store.get('autosplitterHookFilePath') || '')

  // side effects
  useEffect(() => {
    store.set('eocIconVariant', bosses.eoc.currentIconVariant)
    store.set('evilIconVariant', bosses.evil.currentIconVariant)
    store.set('dcIconVariant', bosses.dc.currentIconVariant)
    store.set('twinsIconVariant', bosses.twins.currentIconVariant)
    store.set('planteraIconVariant', bosses.plantera.currentIconVariant)

    store.set('aphb', aphb)
    store.set('scale', scale)
    store.set('showOnlyBossIcons', showOnlyBossIcons)
    store.set('keyColorHex', keyColorHex)
    store.set('gridType', gridType)
    store.set('gridUnitSize', gridUnitSize)
    store.set('autosplitterHookFilePath', autosplitterHookFilePath)
  }, [bosses, aphb, scale, showOnlyBossIcons, keyColorHex, gridType, gridUnitSize, autosplitterHookFilePath])

  useEffect(() => {
    initAutosplitterHook(autosplitterHookFilePath, setBosses)
  }, [autosplitterHookFilePath])

  useEffect(() => { document.title = `${description} ${version}` }, [])

  useEffect(() => { document.body.style.backgroundColor = keyColorHex }, [keyColorHex])

  useEffect(() => {
    let tmpX = Infinity, tmpY = Infinity
    grids[gridType].forEach(bossProps => {
      const { x, y } = getGridCoordinates({ gridType, i: bossProps.i, j: bossProps.j, gridUnitSize })
      if (x < tmpX) {
        tmpX = x
      }
      if (y < tmpY) {
        tmpY = y
      }
    })
    setGridMinX(tmpX)
    setGridMinY(tmpY)
  }, [gridType, gridUnitSize])

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

  const handleChangeGridType = (evt: React.SyntheticEvent<EventTarget>): void => {
    const elem = evt.target as HTMLInputElement
    setGridType(elem.value as GridType)
  }

  const handleBossIconLeftClick = (bossName: BossName): void => {
    setBosses(produce(draft => { draft[bossName].defeated = !draft[bossName].defeated }))
  }

  const handleBossIconRightClick = (bossName: BossName): void => {
    if (
      typeof(bosses[bossName].iconVariantsNumber) === 'number' &&
      typeof(bosses[bossName].currentIconVariant) === 'number'
    ) {
      // REWIEV: wtf is this? I specifically checked that both iconVariantsNumber and currentIconVariant
      //   aren't undefined, yet TS error "Object is possibly 'undefined'.  TS2532"
      //   kept popping up until I added bunch of exclamation marks below.
      //   Maybe I'm stupid or something.
      let nextIconVariant = bosses![bossName!].currentIconVariant! + 1!
      if (nextIconVariant > bosses![bossName!].iconVariantsNumber! - 1) {
        nextIconVariant = 0
      }
      setBosses(produce(draft => { draft[bossName].currentIconVariant = nextIconVariant }))
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
      <div id="settings-grid-type">
        <span>layout:</span>
        <select
          defaultValue={gridType}
          onChange={handleChangeGridType}
        >
          <option value="hexV">hex 1</option>
          <option value="hexH"> hex 2</option>
          <option value="square">square</option>
          <option value="linearV">linear (vertical)</option>
          <option value="linearH">linear (horizontal)</option>
        </select>
      </div>
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
      {grids[gridType].map((bossProps) => {
        if (aphb && bosses[bossProps.bossName].hardmodeExclusive) {
          return false
        }

        let useIconVariants = false
        if (
          typeof(bosses[bossProps.bossName].iconVariantsNumber) === 'number' &&
          typeof(bosses[bossProps.bossName].currentIconVariant) === 'number'
        ) {
          useIconVariants = true
        }

        let imgPath = `./assets/boss-icons/${bossProps.bossName}`
         if (useIconVariants) {
          imgPath += `-v${bosses[bossProps.bossName].currentIconVariant}`
        }
        imgPath += '.png'

        const iconClassNames = ['boss-icon-img']
        if (!bosses[bossProps.bossName].defeated) {
          iconClassNames.push('boss-undefeated')
        }
        if (useIconVariants) {
          iconClassNames.push('pointer')
        }

        const { x, y } = getGridCoordinates({ gridType, i: bossProps.i, j: bossProps.j, gridUnitSize })
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
