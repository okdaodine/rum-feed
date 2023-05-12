import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import { RiMoreFill } from 'react-icons/ri';
import { AiOutlineStar, AiOutlineLink } from 'react-icons/ai';
import { MdInfoOutline, MdClose } from 'react-icons/md';
import { BsFillMicMuteFill } from 'react-icons/bs';
import { lang } from 'utils/lang';
import openTrxModal from 'components/openTrxModal';
import { useStore } from 'store';
import { isMobile } from 'utils/env';
import DrawerMenu from 'components/DrawerMenu';
import { IPost, IComment } from 'apis/types';
import copy from 'copy-to-clipboard';

interface IProps {
  type: 'post' | 'comment'
  data: IPost | IComment
  onClickDeleteMenu?: () => void
}

export default observer((props: IProps) => {
  const { userStore, snackbarStore } = useStore();
  const { type, data } = props;
  const state = useLocalObservable(() => ({
    open: false,
    anchorEl: null,
    showTrxModal: false,
  }));

  const copyLink = () => {
    if (type === 'comment') {
      copy(`${window.origin}/posts/${(data as IComment).objectId}?commentId=${data.id}`);
    } else {
      copy(`${window.origin}/posts/${data.id}`);
    }
    snackbarStore.show({
      message: lang.copied,
    }); 
  }

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
    state.open = true;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
    state.open = false;
  };

  const onClickDeleteMenu = () => {
    if (props.onClickDeleteMenu) {
      props.onClickDeleteMenu();
    }
  }

  if (isMobile) {
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
              invisible: !userStore.isLogin || type === 'comment',
              name: lang.favorite,
              className: '',
              onClick: () => {
                copyLink();
                handleMenuClose();
              },
            },
            {
              name: lang.copyLink,
              className: '',
              onClick: () => {
                copyLink();
                handleMenuClose();
              },
            },
            {
              name: lang.onChainInfo,
              className: '',
              onClick: () => {
                openTrxModal({
                  groupId: data.groupId,
                  trxId: data.trxId
                });
                handleMenuClose();
              },
            },
            {
              invisible: !userStore.isLogin || userStore.address === data.userAddress,
              name: lang.mute,
              className: 'text-red-400 dark:text-red-400',
              onClick: () => {
                handleMenuClose();
              },
            },
            {
              invisible: !props.onClickDeleteMenu || !userStore.isLogin || (userStore.user.role !== 'admin' && data.userAddress !== userStore.address),
              name: lang.delete,
              className: 'text-red-400 dark:text-red-400',
              onClick: () => {
                onClickDeleteMenu();
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
        {userStore.isLogin && type === 'post' && (
          <MenuItem>
            <div className="flex items-center dark:text-white dark:text-opacity-40 text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
              <span className="flex items-center mr-3">
                <AiOutlineStar className="text-18 opacity-50" />
              </span>
              {lang.favorite}
            </div>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          copyLink();
          handleMenuClose();
        }}>
          <div className="flex items-center dark:text-white dark:text-opacity-40 text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
            <span className="flex items-center mr-3">
              <AiOutlineLink className="text-18 opacity-50" />
            </span>
            {lang.copyLink}
          </div>
        </MenuItem>
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
            {lang.onChainInfo}
          </div>
        </MenuItem>
        {userStore.isLogin && userStore.address !== data.userAddress && (
          <div>
            <MenuItem onClick={() => {
              onClickDeleteMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <BsFillMicMuteFill className="text-18 opacity-50" />
                </span>
                <span>{lang.mute}</span>
              </div>
            </MenuItem>
          </div>
        )}    
        {userStore.isLogin && (userStore.address === data.userAddress || userStore.user.role === 'admin') && (
          <div>
            <MenuItem onClick={() => {
              onClickDeleteMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <MdClose className="text-18 opacity-50" />
                </span>
                <span>{lang.delete}</span>
              </div>
            </MenuItem>
          </div>
        )}
      </Menu>
    </div>
  );
});
