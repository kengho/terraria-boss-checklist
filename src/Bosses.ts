type iconPaths = {
  regular: string,
  animated: string,
  animationDuration: number,
}

type Boss = {
  defeated: boolean;
  hardmodeExclusive: boolean;
  requiredForMl: boolean;
  iconPaths: Array<iconPaths>;
  currentIconVariant: number;
}

type Bosses = {
  [key: string]: Boss;
}

export { type Boss, type Bosses }
