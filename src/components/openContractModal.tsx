import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import { TextField, InputLabel, MenuItem, FormControl, Select } from '@material-ui/core';
import { ContractApi } from 'apis';
import { useStore } from 'store';
import sleep from 'utils/sleep';

interface IProps {
  mainnet?: string
  contractAddress?: string
}

const mainnetList = [
  'Ethereum',
  'Arbitrum',
  'Optimism',
  'Polygon',
  'Avalanche',
  'Bsc',
  'Rum'
];

interface IModalProps extends IProps {
  rs: (done: boolean) => void
}

const ModalWrapper = observer((props: IModalProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
    loading: false,
    mainnet: props.mainnet || '',
    contractAddress: props.contractAddress || '',
  }));
  const autoInit = props.mainnet && props.contractAddress;

  React.useEffect(() => {
    setTimeout(() => {
      state.open = true;
    });
  }, []);

  React.useEffect(() => {
    if (autoInit) {
      (async () => {
        await sleep(1000);
        submit();
      })(); 
    }
  }, [])

  const handleClose = (done: boolean) => {
    state.open = false;
    props.rs(done);
  };

  const submit = async () => {
    if (!state.mainnet || !state.contractAddress) {
      return;
    }
    state.loading = true;
    await sleep(400);
    try {
      const res = await ContractApi.checkGroup({
        mainnet: state.mainnet.toLowerCase(),
        contractAddress: state.contractAddress.toLowerCase()
      });
      console.log(res);
      window.location.href = `/groups/${res.groupName}`;
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.loading = false;
  }

  return (
    <Modal open={state.open} onClose={() => handleClose(false)}>
      <div className="p-8 relative w-full md:w-[380px] h-[40vh] md:h-auto box-border">
        <div className="text-18 font-bold dark:text-white dark:text-opacity-80 text-gray-700 text-center">
          <div className="flex items-center justify-center">
            Find your NFT club
          </div>
        </div>
        <div className="pt-8 px-2">
          <FormControl
            className="w-full"
            variant="outlined"
            margin="dense">
            <InputLabel>Select Network</InputLabel>
            <Select
              value={state.mainnet}
              label="Select Network"
              onChange={(e: any) => {
                state.mainnet = e.target.value;
              }}
            >
              {mainnetList.map(mainnet => (
                <MenuItem value={mainnet.toLowerCase()}>
                  <span className="font-bold tracking-wider text-16 py-1">{mainnet}</span>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="pt-2" />
          <TextField
            name='Contract address'
            label="Contract address"
            value={state.contractAddress}
            onChange={(e) => { state.contractAddress = e.target.value; }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                submit();
              }
            }}
            variant="outlined"
            fullWidth
            margin="dense"
          />
        </div>
        <Button
          isDoing={state.loading}
          disabled={!state.mainnet || !state.contractAddress}
          className="w-full mt-8"
          onClick={() => {
            submit();
          }}
        >
          {state.loading && autoInit ? 'Initializing' : lang.ok}
        </Button>
      </div>
    </Modal>
  )
});

export default async (props?: IProps) => new Promise((rs) => {
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
            {...props || {}}
            rs={(done: boolean) => {
              rs(done);
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});