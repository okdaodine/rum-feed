import { IoMdClose } from 'react-icons/io';
import { Dialog, DialogProps } from '@material-ui/core';
import DrawerModal from 'components/DrawerModal';
import { isMobile } from 'utils/env';

interface IProps extends DialogProps {
  hideCloseButton?: boolean
  useDialog?: boolean
}

export default (props: IProps) => {
  const { hideCloseButton, useDialog, ...DialogProps } = props;
  
  if (isMobile && !useDialog) {
    return (
      <DrawerModal
        hideCloseButton={hideCloseButton}
        transitionDuration={DialogProps.transitionDuration}
        open={props.open}
        onClose={props.onClose as any}
      >
        {props.children}
      </DrawerModal>
    )
  }

  return (
    <Dialog
      {...DialogProps}
      maxWidth={false}
      PaperProps={{
        className: "bg-white dark:bg-[#181818] dark:text-white dark:text-opacity-80 rounded-12"
      }}
      className="flex items-center justify-center">
      <div>
        {!hideCloseButton && (
          <div
            className="dark:text-white dark:text-opacity-80 text-gray-6d text-22 p-4 top-0 right-0 absolute cursor-pointer z-10"
            onClick={props.onClose as any}
            data-test-id="dialog-close-button"
          >
            <IoMdClose />
          </div>
        )}
        {props.children}
      </div>
    </Dialog>
  );
};
