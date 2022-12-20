import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { MdSearch, MdClose } from 'react-icons/md';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';

import './index.css';

interface IProps {
  size?: string
  defaultValue?: string
  required?: boolean
  placeholder: string
  className?: string
  autoFocus?: boolean
  disabledClearButton?: boolean
  search: (value: string) => void
  onBlur?: () => void
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    value: '',
  }));

  React.useEffect(() => {
    if (props.defaultValue && !state.value) {
      state.value = props.defaultValue;
    }
  }, [state, props]);

  const onChange = (e: any) => {
    state.value = e.target.value;
  };

  const onKeyDown = async (e: any) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.target.blur();
      if (props.required && !state.value) {
        snackbarStore.show({
          message: lang.searchText,
          type: 'error',
        });
        return;
      }
      await sleep(100);
      props.search(state.value);
    }
  };

  const onBlur = () => {
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <div className="relative">
      <div className="text-20 dark:text-white dark:text-opacity-80 text-gray-af flex items-center absolute top-0 left-0 z-10 mt-2 ml-[10px]">
        <MdSearch />
      </div>
      {state.value && (
        <div className="flex items-center absolute top-0 right-0 z-10 mr-[10px] mt-2 cursor-pointer">
          <div
            className="flex items-center h-5 w-5 justify-center dark:bg-[#181818] bg-gray-f7 dark:text-white dark:text-opacity-80 text-black rounded-full text-18"
            onClick={async () => {
              state.value = '';
              await sleep(200);
              props.search('');
            }}
          >
            {!props.disabledClearButton && <MdClose />}
          </div>
        </div>
      )}
      <form action="/">
        <TextField
          className={`search-input ${props.className || 'w-72'} ${
            props.size || ''
          }`}
          placeholder={props.placeholder || '搜索'}
          size="small"
          autoFocus={props.autoFocus || false}
          value={state.value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          margin="none"
          variant="outlined"
          type="search"
        />
      </form>
    </div>
  );
});
