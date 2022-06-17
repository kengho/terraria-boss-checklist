import produce from 'immer'

import { Bosses } from './Bosses'

const bossNamesMapping: { [key: string]: string } = {
  'WallofFlesh': 'wof',
  'EyeofCthulhu': 'eoc',
  'EaterofWorldsBrainofCthulhu': 'evil',
  'Skeletron': 'skeletron',
  'QueenBee': 'qb',
  'KingSlime': 'ks',
  'Plantera': 'plantera',
  'Golem': 'golem',
  'DukeFishron': 'fishron',
  'LunaticCultist': 'cultist',
  'MoonLord': 'ml',
  'EmpressofLight': 'eol',
  'QueenSlime': 'qs',
  'TheDestroyer': 'destroyer',
  'TheTwins': 'twins',
  'SkeletronPrime': 'prime',
  'Deerclops': 'dc',
  'NebulaPillar': 'pillars',
}

const readDataAndUpdateState = (autosplitterHookFilePath: string, setBosses: Function): void  => {
  // console.log('readDataAndUpdateState')
  const fs = require('fs')
  if (!fs.existsSync(autosplitterHookFilePath)) {
    return
  }

  fs.readFile(autosplitterHookFilePath, 'utf-8', (err: null | string, data: string) => {
    if (err) {
      return
    }
    // 'data' must look something like this (with "\r\n" at newlines)
    //
    // WallofFlesh,False
    // EyeofCthulhu,False
    // EaterofWorldsBrainofCthulhu,False
    // Skeletron,True
    // QueenBee,False
    // KingSlime,False
    // Plantera,False
    // Golem,False
    // DukeFishron,False
    // LunaticCultist,True
    // MoonLord,True
    // EmpressofLight,False
    // QueenSlime,False
    // TheDestroyer,False
    // TheTwins,False
    // SkeletronPrime,True
    // Deerclops,True
    // NebulaPillar,True
    //

    setBosses(produce((draft: Bosses) => {
      data.split("\r\n").forEach((line: string) => {
        const match = line.match(/^(\S+),(True|False)$/)
        if (!match) {
          return
        }
        const autosplittersBossName: string = match[1]
        const autosplittersDefeated: string = match[2]
        const bossName: string = bossNamesMapping[autosplittersBossName]
        const defeated: boolean = (autosplittersDefeated === 'True')

        // is case there are user made custom bosses
        if (draft[bossName]) {
          draft[bossName].defeated = defeated
        }
      })
    }))
  })
}

const initAutosplitterHook = (autosplitterHookFilePath: string, setBosses: Function): any => {
  const fs = require('fs')
  if (!fs.existsSync(autosplitterHookFilePath)) {
    return
  }

  // TODO: unwatch.
  const chokidar = require('chokidar')
  const watcher = chokidar.watch(autosplitterHookFilePath, { persistent: true, usePolling: true })
  const action = () => readDataAndUpdateState(autosplitterHookFilePath, setBosses)
  watcher
    .on('ready', action)
    .on('change', action)
}

export default initAutosplitterHook
