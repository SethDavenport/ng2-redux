/** @hidden */
export type Pathable = {
  [key: string]: any,
  [index: number]: any,
  getIn?: (pathElems: Path) => any;
};

/** @hidden */
export type Path = (string | number)[];
