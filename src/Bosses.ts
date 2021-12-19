const bossNames = [
  'cultist', 'dc', 'destroyer', 'eoc', 'eol', 'evil',
  'fishron', 'golem', 'ks', 'ml', 'plantera', 'prime',
  'qb', 'qs', 'skeletron', 'twins', 'wof'
] as const

type BossName = typeof bossNames[number]
type Boss = {
  defeated: boolean;
  hardmodeExclusive: boolean;
  iconVariantsNumber?: number;
  currentIconVariant?: number;
}
type Bosses = {
  [key in BossName]: Boss;
}

export { bossNames, type BossName, type Bosses }
