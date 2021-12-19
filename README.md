## Summary

Electron-wrapped web app similar to [terraria-boss-checklist by DrYoshiyahu](https://github.com/DrYoshiyahu/terraria-boss-checklist). Currently it uses Electron in order to utilize dirty file-based hook to [Terraria autosplitter](https://github.com/kengho/LiveSplit.Terraria) (forked from [Voxelse](https://github.com/voxelse/LiveSplit.Terraria)).

![screenshot](/doc/screenshot1.png)

## New features

1. Added Terraria 1.4.3 Deerclops boss and corresponding grid layouts (17 bosses in total)
2. Added build-in `scale` settings for the ones who capture their whole screen or who doesn't know how to scale pixel art in OBS
3. Added `grid unit size` (useful for linear layouts) and `key color` settings
4. Some icons (namely Cultist and EoC) are modified to fit the grid better
5. The icons are better placed in terms of the way people speedrun the game: pre-hardmode bosses are clustered together, obligatory bosses and optional bosses too. Slime royal family is back together (this is the most important feature by far)

## Dev

```
// install
yarn install
yarn electron-dev

// test
yarn test

// build
yarn electron-pack
```

## LiveSplit AutoSplitter integration

If there's enough demand, this app could be modified and hosted as simple web page online (using github.io) and integrated with LiveSplit, but in order to do this one must:
1. made appropriate changes to [autosplitter](https://github.com/voxelse/LiveSplit.Terraria), preferably using webView2
2. change the way the user setting are stored (perhaps they could be stored in the URL)

Alternatively, [DrYoshiyahu](https://github.com/DrYoshiyahu/terraria-boss-checklist) may eventually modify their app by introducing new features, rendering this app obsolete.

For now though, the only way to use autosplitter with this app is to build and replace `LiveSplit.Terraria.dll` using [this fork](https://github.com/kengho/LiveSplit.Terraria).

## TODO

* allow moving icons inside the grid
* read `assets` on start and set the icon-based state automatically (thus losing typechecking for boss names, need to think it through)
* optimize linear layouts (reusing square layout for now)
* handle errors better

## License

Terraria Boss Checklist is distributed under the MIT-LICENSE.
