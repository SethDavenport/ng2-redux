// Agostic selector
// Just needs something that makes an observable...
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import {
  PropertySelector,
  PathSelector,
  FunctionSelector,
  Comparator,
  NgRedux,
} from '../components/ng-redux';

interface INgSelectable {
  select: () => Observable<any>;
}

@Injectable()
class NgSelect {
  static store;

  initialize(selectable: INgSelectable) {
    // TODO: error check for double init.
    NgSelect.store = selectable;
  }
}

export type PropertyDecorator = (target: any, propertyKey: string) => void;

export function select<T>(
  selector?: PropertySelector | PathSelector | FunctionSelector<any, T>,
  comparator?: Comparator): PropertyDecorator {

  return function decorate(target: any, key: string): void {
    let bindingKey = selector;
    if (!selector) {
      bindingKey = (key.lastIndexOf('$') === key.length - 1) ?
        key.substring(0, key.length - 1) :
        key;
    }

    function getter() {
      // TODO: only rely on base select, move path/function/key stuff in here.
      return NgSelect.store.select(bindingKey, comparator);
    }

    // Replace decorated property with a getter that returns the observable.
    if (delete target[key]) {
      Object.defineProperty(target, key, {
        get: getter,
        enumerable: true,
        configurable: true
      });
    }
  };
}
