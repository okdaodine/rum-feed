import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { isPc } from 'utils/env';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { FiFilter } from 'react-icons/fi';
import TextField from '@material-ui/core/TextField';
import Fade from '@material-ui/core/Fade';
import { lang } from 'utils/lang';

interface IProps {
  q: string
  minLike?: string
  minComment?: string
}

interface IModalProps extends IProps {
  close: (result?: IProps) => void
}

const Main = observer((props: IModalProps) => {
  const state = useLocalObservable(() => ({
    showCondition: false,
    q: props.q || '',
    minLike: props.minLike || '',
    minComment: props.minComment || '',
  }));

  React.useEffect(() => {
    state.showCondition = !!(props.minLike || props.minComment);
  }, []);

  const submit = async () => {
    props.close({
      q: state.q,
      minLike: state.minLike === '0' ? '' : state.minLike,
      minComment: state.minComment === '0' ? '' : state.minComment,
    });
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  }

  return (
    <div className="box-border px-12 py-12 pb-10 w-full md:w-[330px] ">
      <form action="/">
        <TextField
          autoFocus={isPc}
          label={lang.search}
          value={state.q}
          onChange={(e) => {
            state.q = e.target.value;
          }}
          onKeyDown={onKeyDown}
          variant="outlined"
          margin="dense"
          type="search"
          fullWidth
        />
      </form>
      {!state.showCondition && (
        <div className="flex justify-center mt-5 dark:text-white dark:text-opacity-80 text-gray-9c" onClick={() => {
          state.showCondition = true;
        }}>
          <span className="cursor-pointer flex items-center">{lang.filter} <FiFilter className="text-14 ml-1" /></span>
        </div>
      )}
      {state.showCondition && (
        <Fade in={true} timeout={350}> 
          <div className="mt-5 w-[170px] mx-auto opacity-70">
            <TextField
              label={lang.minimumLikes}
              value={state.minLike}
              onChange={(e) => {
                const re = /^[0-9]+$/;
                if (re.test(e.target.value)) {
                  state.minLike = e.target.value;
                } else if (e.target.value === '') {
                  state.minLike = '';
                }
              }}
              onKeyDown={onKeyDown}
              variant="outlined"
              margin="dense"
              fullWidth
            />
            <div className="mt-3" />
            <TextField
              label={lang.minimumComments}
              value={state.minComment}
              onChange={(e) => {
                const re = /^[0-9]+$/;
                if (re.test(e.target.value)) {
                  state.minComment = e.target.value;
                } else if (e.target.value === '') {
                  state.minComment = '';
                }
              }}
              onKeyDown={onKeyDown}
              variant="outlined"
              margin="dense"
              fullWidth
            />
          </div>
        </Fade>
      )}
      <Button
        size="large"
        className="w-full mt-10"
        onClick={submit}
      >
        {lang.ok}
      </Button>
    </div>
  )
});

const ModalWrapper = observer((props: IModalProps) => {
  const state = useLocalObservable(() => ({
    open: false,
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  const close = (result?: IProps) => {
    state.open = false;
    props.close(result);
  }

  return (
    <Modal open={state.open} onClose={() => close()}>
      <Main {...props} close={close} />
    </Modal>
  )
});

export default (props?: IProps) => new Promise<IProps | undefined>((rs) => {
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
            {...(props || {}) as IProps}
            close={(result) => {
              rs(result);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});
