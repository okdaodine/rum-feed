import React from 'react';
import { Drawer, DrawerProps } from '@material-ui/core';
import { MdClear } from 'react-icons/md';
import classNames from 'classnames';

import './index.css';

interface Props extends DrawerProps {
  open: boolean;
  onClose: () => unknown;
  hideCloseButton?: boolean;
  smallRadius?: boolean;
  darkMode?: boolean;
  useCustomZIndex?: boolean;
  children: React.ReactNode;
}

export default (props: Props) => {
  const {
    open,
    onClose,
    hideCloseButton,
    smallRadius,
    darkMode = false,
    useCustomZIndex = false,
  } = props;
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      transitionDuration={props.transitionDuration}
      ModalProps={{ className: `drawer-modal ${useCustomZIndex ? 'custom-z-index' : ''}` }}
    >
      <div
        className={classNames(
          {
            'small-radius': smallRadius,
          },
          'content relative overflow-hidden bg-white dark:bg-[#181818]',
        )}
      >
        {props.children}
        {!hideCloseButton && (
          <div
            onClick={onClose}
            className={classNames(
              {
                'text-white': !darkMode,
                'dark:text-white dark:text-opacity-80': darkMode,
              },
              'absolute top-0 right-0 p-3 mr-1',
            )}
          >
            <div className="flex justify-center items-center w-6 h-6 rounded-full text-32 dark:text-white dark:text-opacity-80 text-black pr-1">
              <MdClear />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
