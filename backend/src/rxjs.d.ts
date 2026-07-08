declare module 'rxjs' {
  export class Observable<T> {
    pipe(...args: any[]): Observable<any>;
  }
  export interface CallHandler {
    handle(): Observable<any>;
  }
}
declare module 'rxjs/operators' {
  export function tap(next?: (value: any) => void, error?: (error: any) => void, complete?: () => void): any;
  export function map(project: (value: any, index: number) => any): any;
}
