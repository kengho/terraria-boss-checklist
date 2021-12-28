type Boss = {
  defeated: boolean;
  hardmodeExclusive: boolean;
  iconPaths: Array<string>;
  currentIconVariant: number;
}

type Bosses = {
  [key: string]: Boss;
}

export { type Boss, type Bosses }
