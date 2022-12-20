import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import { RiMoreFill } from 'react-icons/ri';
import { MdInfoOutline, MdClose } from 'react-icons/md';
import { lang } from 'utils/lang';
import openTrxModal from 'components/openTrxModal';
import { useStore } from 'store';
import { isMobile, isPc } from 'utils/env';
import DrawerMenu from 'components/DrawerMenu';

interface IProps {
  data: {
    groupId: string,
    trxId: string,
    userAddress: string
  }
  onClickUpdateMenu: () => void
  onClickDeleteMenu: () => void
}

export default observer((props: IProps) => {
  const { userStore } = useStore();
  const { data } = props;
  const state = useLocalObservable(() => ({
    open: false,
    anchorEl: null,
    showTrxModal: false,
  }));

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
    state.open = true;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
    state.open = false;
  };

  if (isMobile) {
    if (!userStore.isLogin || (userStore.user.role !== 'admin' && props.data.userAddress !== userStore.address)) {
      return null;
    }

    return (
      <div>
        <div
          className="dark:text-white dark:text-opacity-40 text-gray-af px-[2px] opacity-80 cursor-pointer mt-[1px]"
          onClick={handleMenuClick}
        >
          <RiMoreFill className="text-20" />
        </div>
        <DrawerMenu
          open={state.open}
          onClose={() => {
            state.open = false;
          }}
          items={[
            {
              name: '删除',
              className: 'text-red-400',
              onClick: () => {
                props.onClickDeleteMenu();
                handleMenuClose();
              },
            },
          ]}
        />
      </div>
    )
  }

  return (
    <div>
      <div
        className="dark:text-white dark:text-opacity-40 text-gray-af px-[2px] opacity-80 cursor-pointer"
        onClick={handleMenuClick}
      >
        <RiMoreFill className="text-20" />
      </div>

      <Menu
        anchorEl={state.anchorEl}
        open={state.open}
        onClose={handleMenuClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            margin: '27px 0 0 20px',
          },
        }}
      >
        {isPc && (
          <MenuItem onClick={() => {
            openTrxModal({
              groupId: data.groupId,
              trxId: data.trxId
            });
            handleMenuClose();
          }}>
            <div className="flex items-center dark:text-white dark:text-opacity-40 text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
              <span className="flex items-center mr-3">
                <MdInfoOutline className="text-18 opacity-50" />
              </span>
              {lang.info}
            </div>
          </MenuItem>
        )}
        {userStore.isLogin && (userStore.address === data.userAddress || userStore.user.role === 'admin') && (
          <div>
            {/* <MenuItem
              onClick={() => {
              props.onClickUpdateMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center dark:text-white dark:text-opacity-40 text-gray-600 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <MdOutlineEdit className="text-18 opacity-50" />
                </span>
                <span>编辑</span>
              </div>
            </MenuItem> */}
            <MenuItem onClick={() => {
              props.onClickDeleteMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <MdClose className="text-18 opacity-50" />
                </span>
                <span>删除</span>
              </div>
            </MenuItem>
          </div>
        )}
      </Menu>
    </div>
  );
});
