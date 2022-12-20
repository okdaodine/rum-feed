import DrawerModal from 'components/DrawerModal';
import sleep from 'utils/sleep';

type Item = {
  invisible?: boolean;
  name: string;
  onClick: () => void;
  stayOpenAfterClick?: boolean;
  className?: string;
};

interface IProps {
  open: boolean;
  onClose: () => unknown;
  items: Item[];
}

const MenuItem = (props: any) => {
  const { onClick, className } = props;
  return (
    <div
      className={`py-4 dark:text-white dark:text-opacity-80 text-gray-4a text-center border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-ec bg-white dark:bg-[#181818] text-16 ${className}`}
      onClick={onClick}
    >
      {props.children}
    </div>
  );
};

export default (props: IProps) => {
  const { open, onClose, items } = props;

  return (
    <DrawerModal
      hideCloseButton
      smallRadius
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <div className="dark:bg-[#181818] bg-gray-f2 leading-none rounded-t-10">
        {items
          .filter((item) => !item.invisible)
          .map((item) => (
            <div key={item.name}>
              <MenuItem
                className={item.className}
                onClick={async () => {
                  if (!item.stayOpenAfterClick) {
                    onClose();
                  }
                  await sleep(item.stayOpenAfterClick ? 0 : 200);
                  item.onClick();
                }}
              >
                {item.name}
              </MenuItem>
            </div>
          ))}
        <div className="mt-1">
          <MenuItem
            onClick={() => {
              onClose();
              // stopBodyScroll(false);
            }}
          >
            取消
          </MenuItem>
        </div>
      </div>
    </DrawerModal>
  );
};
