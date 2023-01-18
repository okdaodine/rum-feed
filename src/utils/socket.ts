import io, { Socket } from 'socket.io-client';
import { API_ORIGIN } from 'apis/common';

let socket: Socket;

export const initSocket = () => {
  socket = io(API_ORIGIN, {
    transports: ['websocket', 'polling']
  });
  return socket;
}

export const getSocket = () => {
  return socket;
};