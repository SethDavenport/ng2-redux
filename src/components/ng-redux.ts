import { Injectable } from '@angular/core';
import {
  Store,
  Action,
  ActionCreator,
  Reducer,
  Middleware,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  createStore,
  applyMiddleware,
  compose
} from 'redux';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { omit } from '../utils/omit';
import { getIn } from '../utils/get-in';

export type PropertySelector = string | number | symbol;
export type PathSelector = (string | number)[];
export type FunctionSelector<RootState, S> = ((s: RootState) => S);
export type Comparator = (x: any, y: any) => boolean;

@Injectable()
export class NgRedux<RootState> {

  private _store: Store<RootState> = null;
  private _store$: BehaviorSubject<RootState> = null;

  static instance;

  constructor() {
    NgRedux.instance = this;
    this._store$ = new BehaviorSubject<RootState>(null)
      .filter(n => n !== null)
      .switchMap(n => {
        return Observable.from(n as any);
      }) as BehaviorSubject<RootState>;
  }

  /**
   * configures a Redux store and allows NgRedux to observe and dispatch
   * to it.
   *
   * This should only be called once for the lifetime of your app, for
   * example in the constructor of your root component.
   *
   * @param {Redux.Reducer<RootState>} reducer Your app's root reducer
   * @param {RootState} initState Your app's initial state
   * @param {Redux.Middleware[]} middleware Optional Redux middlewares
   * @param {Redux.StoreEnhancer<RootState>[]} Optional Redux store enhancers
   */
  configureStore(
    reducer: Reducer<RootState>,
    initState: RootState,
    middleware: Middleware[] = [],
    enhancers: StoreEnhancer<RootState>[] = []) {

    if (this._store) {
      throw new Error('Store already configured!');
    }

    const finalCreateStore
      = <StoreEnhancerStoreCreator<RootState>>compose(
        applyMiddleware(...middleware),
        ...enhancers
      )(createStore);
    const store = finalCreateStore(reducer, initState);

    this.setStore(store);
  }

  /**
   * Accepts a Redux store, then sets it in NgRedux and
   * allows NgRedux to observe and dispatch to it.
   *
   * This should only be called once for the lifetime of your app, for
   * example in the constructor of your root component. If configureStore
   * has been used this cannot be used.
   *
   * @param {Redux.Store} store Your app's store
   */
  provideStore(store: Store<RootState>) {
    if (this._store) {
      throw new Error('Store already configured!');
    }

    this.setStore(store);
  };

  /**
   * Select a slice of state to expose as an observable.
   *
   * @template S
   * @param { PropertySelector |
   *  PathSelector |
   *  FunctionSelector<RootState, S>}
   * selector key or function to select a part of the state
   * @param { Comparator } [comparer] Optional
   * comparison function called to test if an item is distinct
   * from the previous item in the source.
   *
   * @returns {Observable<S>} an Observable that emits items from the
   * source Observable with distinct values.
   */
  select<S>(
    selector: PropertySelector |
      PathSelector |
      FunctionSelector<RootState, S>,
    comparator?: Comparator): Observable<S> {

    let result: Observable<S>;

    if (typeof selector === 'string' ||
      typeof selector === 'number' ||
      typeof selector === 'symbol') {

      result = this._store$.map(s => s[selector as PropertySelector]);
    } else if (Array.isArray(selector)) {
      result = this._store$.map(s => getIn(s, selector as PathSelector));
    } else {
      result = this._store$.map(selector as FunctionSelector<RootState, S>);
    }

    return result.distinctUntilChanged(comparator);
  }

  /**
   * Get the current state of the application
   * @returns {RootState} the application state
   */
  getState = (): RootState => {
    return this._store.getState();
  };

  /**
   * Subscribe to the Redux store changes
   *
   * @param {() => void} listener callback to invoke when the state is updated
   * @returns a function to unsubscribe
   */
  subscribe = (listener: () => void): Function => {
    return this._store.subscribe(listener);
  };

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param nextReducer The reducer for the store to use instead.
   */
  replaceReducer = (nextReducer: Reducer<RootState>) => {
    return this._store.replaceReducer(nextReducer);
  };

  /**
   * Dispatch an action to Redux
   */
  dispatch = <A extends Action>(action: A): any => {
    return this._store.dispatch(action);
  };

  /**
   * Helper function to set the store to NgRedux and
   * allow NgRedux to observe and dispatch to it.
   *
   * @param {Redux.Store} store The redux store
   */
  private setStore(store: Store<RootState>) {
    this._store = store;
    this._store$.next(store as any);
    const cleanedStore = omit(store, [
      'dispatch',
      'getState',
      'subscribe',
      'replaceReducer']);
    Object.assign(this, cleanedStore);
  }
};
