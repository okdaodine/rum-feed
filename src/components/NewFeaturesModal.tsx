import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { FeatureApi } from 'apis';
import { IFeature } from 'apis/types';
import { useStore } from 'store';
import sleep from 'utils/sleep';

export default observer(() => {
  const { userStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
    visible: false,
    features: [] as IFeature[]
  }));

  React.useEffect(() => {
    (async () => {
      try {
        await sleep(2000);
        const features = await FeatureApi.list(userStore.address);
        if (features.length > 0) {
          state.features = features;
          state.open = true;
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (state.open) {
      setTimeout(() => {
        state.visible = true;
      }, 500);
    }
  }, [state.open]);

  return (
    <Modal
      transitionDuration={{
        appear: 0,
        enter: 700,
        exit: 200,
      }}
      open={state.open} onClose={() => {
      state.open = false;
    }}>
      <div className="p-8 px-10 md:px-12 h-[95vh] md:h-[auto] md:max-h-[650px] box-border overflow-y-auto">
        <div className="-mt-2 dark:text-white dark:text-opacity-80 text-neutral-600 text-20 text-center font-bold">欢迎回来</div>
        <div className="pt-3 dark:text-white dark:text-opacity-80 text-neutral-500 text-12 text-center">自从您上次登录，我们新增了以下功能：</div>
        <div className={`${state.visible ? 'visible' : 'invisible'}`}>
          <div className="min-h-[55vh] md:min-h-[300px]">
            {state.features.map(feature => (
              <div className="mt-5 w-full md:w-[320px]" key={feature.id}>
                <img className="rounded-10" src={feature.image} alt={feature.name} />
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10 pb-2">
            <Button size="large" onClick={() => {
              state.open = false;
            }}>我知道了</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
})