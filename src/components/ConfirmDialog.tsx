import { observer } from 'mobx-react-lite';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { useStore } from 'store';
import { isPc, isMobile } from 'utils/env';

export default observer(() => {
  const { confirmDialogStore } = useStore();
  const {
    open,
    ok,
    cancel,
    content,
    cancelText,
    cancelDisabled = false,
    okText = '确定',
    contentClassName,
    loading,
  } = confirmDialogStore;

  return (
    <Modal
      hideCloseButton
      useDialog
      open={open}
      onClose={() => {
        if (!cancel) {
          confirmDialogStore.hide();
        }
      }}
    >
      <div className="min-w-[70vw] md:min-w-[auto]">
        <div className="pt-8 md:pt-10 pb-6 md:pb-8 px-8 md:px-12">
          <div className="flex items-center justify-center md:min-h-[60px]">
            <div
              className={`dark:text-white dark:text-opacity-80 text-neutral-500 leading-7 ${contentClassName} md:min-w-[160px] md:max-w-[250px] text-center text-16`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
          {isPc && (
            <div className="flex mt-[26px] items-center justify-center w-full">
              {!cancelDisabled && (
                <Button
                  size="large"
                  className="w-[110px] mr-5 opacity-70"
                  outline
                  onClick={() => {
                    if (cancel) {
                      cancel();
                    } else {
                      confirmDialogStore.hide();
                    }
                  }}>
                  {cancelText}
                </Button>
              )}
              <Button
                size="large"
                className={`${cancelDisabled ? 'w-[150px]' : 'w-[110px]'}`}
                onClick={() => ok()}
                isDoing={loading}>
                {okText}
              </Button>
            </div>
          )}
        </div>
        {isMobile && (
          <div className="border-t border-white border-opacity-10 w-full flex">
            {!cancelDisabled && (
              <div
                className="text-15 py-3 flex-1 border-r border-white border-opacity-10 text-center text-slate-500"
                onClick={() => {
                  if (cancel) {
                    cancel();
                  } else {
                    confirmDialogStore.hide();
                  }
                }}>
                {cancelText}
              </div>
            )}
            <div
              className="text-15 py-3 flex-1 border-r border-white border-opacity-10 text-center dark:text-white dark:text-opacity-80 text-neutral-700 font-bold"
              onClick={() => ok()}>
              {okText}{loading && '...'}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
});
