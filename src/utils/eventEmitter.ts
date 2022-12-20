import EventEmitter from 'events';

const ee = new EventEmitter();

type EventName = 'content' | 'loadedData' | 'notification';

export const on = (name: EventName, fn: any) => {
  ee.on(name, fn);
}

export const emit = (name: EventName, data?: any) => {
  ee.emit(name, data);
}

export const off = (name: EventName, fn: any) => {
  ee.off(name, fn);
}