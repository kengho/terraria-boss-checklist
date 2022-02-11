import React, { useState, useEffect } from 'react'
import { BossProps, LayoutType, getGridCoordinates } from './Layouts'

type BossIconProps = {
  bossProps: BossProps,
  regularPath: string,
  animatedPath: string,
  animationDuration: number,
  defeated: boolean,
  useIconVariants: boolean,
  layoutType: LayoutType,
  gridUnitSize: number,
  animationsCooldown: number,
  leftClickHandler: any,
  rightClickHandler: any,
}

const BossIcon = (props: BossIconProps) => {
  const {
    bossProps,
    regularPath,
    animatedPath,
    animationDuration,
    defeated,
    useIconVariants,
    layoutType,
    gridUnitSize,
    animationsCooldown,
    leftClickHandler,
    rightClickHandler,
  } = props
  const { bossName, i, j }  = bossProps
  let { x, y }  = bossProps

  const [currentlyAnimated, setCurrentlyAnimated] = useState<boolean>(false)

  useEffect(() => {
    if (typeof animatedPath !== 'string') {
      return
    }

    if (animationsCooldown === 0) {
      return
    }

    const animationsCooldownMs = animationsCooldown * 60 * 1000
    const animationsOffsetTimeMs = Math.round(Math.random() * animationsCooldownMs)
    const animationDurationMs = animationDuration // already in ms
    const animationsLoopsNumber = 1
    const totalAnimationDurationMs = animationDurationMs * animationsLoopsNumber

    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout
    let timer3: NodeJS.Timeout
    timer1 = setTimeout(() => {
      timer2 = setInterval(() => {
        timer3 = setTimeout(() => setCurrentlyAnimated(false), totalAnimationDurationMs);
        setCurrentlyAnimated(true)
      }, animationsCooldownMs + totalAnimationDurationMs)
    }, animationsOffsetTimeMs)

    // NOTE: I didn't test it throughly, but it seems to be the right way.
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [animatedPath, animationDuration, animationsCooldown])

  const { app } = require('@electron/remote')
  const path = require('path')
  let imgPath = regularPath
  if (currentlyAnimated) {
    imgPath = animatedPath
  }
  if (app.isPackaged) {
    // escaping from 'resources/app.asar'
    imgPath = path.format({ root: '../../../public/', base: imgPath })
  } else {
    imgPath = path.format({ root: './', base: imgPath })
  }

  const iconClassNames = ['boss-icon-img']
  if (!defeated) {
    iconClassNames.push('boss-undefeated')
  }
  if (useIconVariants) {
    iconClassNames.push('pointer')
  }

  if (layoutType !== 'cartesian') {
    ({ x, y } = getGridCoordinates({
      layoutType,
      i, j,
      gridUnitSize,
    }))
  }

  return <div
    className="boss-icon-wrapper"
    style={{
      width: gridUnitSize,
      height: gridUnitSize,
      left: x - gridUnitSize / 2,
      top: y - gridUnitSize / 2,
    }}
  >
    <img
      alt={bossName}
      className={iconClassNames.join(' ')}
      src={imgPath}
      onClick={() => leftClickHandler(bossName)}
      onContextMenu={/* change if not electron */ () => rightClickHandler(bossName)}
    />
  </div>
}

export default BossIcon
