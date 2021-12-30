// code sample used to generate circle layout
// it's kinda ironic that I used cartesian coordinates for that

//        0
//   9          1
// 8              2
// 7              3
//  6           4
//        5
const cx = 110
const cy = 110
const r = 110
const shiftLeft = 20
const shiftTop = 20
const bosses = [
  'ks', 'eoc', 'evil', 'qb',
  'skeletron', 'dc', 'wof', 'qs', 'destroyer',
  'twins', 'prime', 'fishron', 'plantera',
  'eol', 'golem', 'cultist', 'ml'
]
bosses.forEach((bossName, i) => {
  let x = cx + r * Math.sin(2 * Math.PI / bosses.length * i) + shiftLeft
  let y = cy - r * Math.cos(2 * Math.PI / bosses.length * i) + shiftTop
  console.log(`- bossName: ${bossName}\n  x: ${Math.round(x)}\n  y: ${Math.round(y)}`)
})
