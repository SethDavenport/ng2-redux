import { getIn } from '../utils/get-in';
import { Observable } from 'rxjs/Observable';
import { Pathable } from '../utils/path-types';

export type Comparator = (x: any, y: any) => boolean;
export type Transformer<RootState, V> = (store$: Observable<RootState>) => Observable<V>
export type PropertySelector = string | number | symbol;
export type PathSelector = (string | number)[];
export type FunctionSelector<RootState, S> = ((s: RootState) => S);
export type Selector<RootState, S> = PropertySelector |
  PathSelector |
  FunctionSelector<RootState, S>;

/** @hidden */
export const sniffSelectorType = <RootState, S>(selector?: Selector<RootState, S>) =>
  !selector ?
    'nil' :
    Array.isArray(selector) ?
      'path' :
      typeof selector === 'function' ?
        'function' :
        'property';

/** @hidden */
export const resolver = <RootState extends Pathable, S>(selector?: Selector<RootState, S>) => ({
  property: (state: RootState): S => state[selector as PropertySelector],
  path: (state: RootState): S => getIn(state, selector as PathSelector),
  function: selector as FunctionSelector<RootState, S>,
  nil: (state: RootState): RootState => state,
});

/** @hidden */
export const resolveToFunctionSelector = <RootState, S>(selector?: Selector<RootState, S>) =>
  resolver(selector)[sniffSelectorType(selector)];
