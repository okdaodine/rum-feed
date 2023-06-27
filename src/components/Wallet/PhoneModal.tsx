import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import Button from 'components/Button';
import { useStore } from 'store';
import Modal from 'components/Modal';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import { VaultApi } from 'apis';
import Loading from 'components/Loading';
import { isPc } from 'utils/env';

interface IProps {
  open: boolean
  onClose: () => void
}

const Main = observer(() => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    countdown: 0,
    phone: '',
    code: '',
    sendingCode: false,
    submitting: false,
  }));
  const timerRef = React.useRef(0 as any);

  const submit = async () => {
    state.submitting = true;
    try {
      const res = await VaultApi.verifySmsCode({
        mobile: state.phone,
        code: Number(state.code)
      });
      window.location.href = `?token=${res.token}`;
    } catch (err: any) {
      let message = '';
      if (err.message.includes('invalid')) {
        message = lang.invalid(lang.verificationCode);
      } 
      snackbarStore.show({
        message: message || lang.somethingWrong,
        type: 'error',
      });
      state.submitting = false;
    }
  }
  
  const sendCode = async () => {
    state.sendingCode = true;
    try {
      await VaultApi.sendSmsCode({
        mobile: state.phone
      });
      state.countdown = 60;
      timerRef.current = setInterval(() => {
        state.countdown -= 1;
        if (state.countdown === 0) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } catch (err) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.sendingCode = false;
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  return (
    <div className="p-8 w-full md:w-[340px] box-border">
      <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
        {lang.loginWithPhone}
      </div>
      <div className="pt-5 px-4">
        <TextField
          label={lang.phone}
          value={state.phone}
          onChange={(e) => { state.phone = e.target.value; }}
          variant="outlined"
          fullWidth
          margin="dense"
          autoFocus={isPc}
        />
        <div className="mt-3" />
        <div className="relative">
          <TextField
            label={lang.verificationCode}
            value={state.code}
            onChange={(e) => { state.code = e.target.value; }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                submit();
              }
            }}
            variant="outlined"
            fullWidth
            margin="dense"
            inputProps={{
              maxLength: 6,
            }}
          />
          <div
            className={classNames({
              'text-blue-400 cursor-pointer opacity-100': !state.countdown && state.phone && state.phone.length === 11,
            }, "absolute z-10 top-[6px] right-[5px] py-3 px-3 opacity-50")}
            onClick={sendCode}>
            {state.countdown ? lang.resentAfter(state.countdown) : lang.getVerificationCode}
            {state.sendingCode && (
              <div className="absolute top-[16px] left-[-7px]">
                <Loading size={12} /> 
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          disabled={!state.phone || !state.code}
          className="mt-8 w-full md:w-auto"
          onClick={submit}
        >{lang.ok}{state.submitting && '...'}</Button>
      </div>
    </div>
  )
})


export default observer((props: IProps) => (
  <Modal hideCloseButton open={props.open} onClose={() => props.onClose()}>
    <Main />
  </Modal>
));
