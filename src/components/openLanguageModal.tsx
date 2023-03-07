import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { Radio, RadioGroup, FormControlLabel } from '@material-ui/core';
import { i18n } from 'store/i18n';
import Button from 'components/Button';

const ModalWrapper = observer((props: { rs: () => void }) => {
  const state = useLocalObservable(() => ({
    open: false,
    value: i18n.state.lang
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  return (
    <Modal open={state.open} onClose={() => handleClose()}>
      <div className="p-8 relative w-full md:w-[240px] box-border">
        <div className="pt-2 px-6 pb-5">
          <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center pb-5">
            {lang.language}
          </div>
          <div className="pt-2">
            <RadioGroup
              value={state.value}
              onChange={(e) => {
                const value = e.target.value as 'en' | 'cn';
                state.value = value;
              }}
            >
              <FormControlLabel value="en" control={<Radio />} label={<span className="ml-2">English</span>} />
              <div className="pt-4" />
              <FormControlLabel value="cn" control={<Radio />} label={<span className="ml-2">简体中文</span>} />
            </RadioGroup>
          </div>
        </div>
        <Button
          className="w-full mt-2"
          onClick={() => {
          i18n.switchLang(state.value);
          window.location.reload();
        }}>{lang.save}</Button>
      </div>
    </Modal>
  )
});

export default async () => new Promise((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <ModalWrapper
            rs={() => {
              rs(true);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});