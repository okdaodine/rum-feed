import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
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
import { TrxApi, FavoriteApi } from 'apis';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';

interface IProps {
  type: 'post' | 'comment'
  data: IPost | IComment
  onClickDeleteMenu?: () => void
}

interface IMainProps extends IProps {
  handleMenuClose: any
  setAnchorEl: any
}

const Main = observer((props: IMainProps) => {
  const {
    userStore,
    snackbarStore,
    confirmDialogStore,
    groupStore,
    postStore
  } = useStore();
  const { type, data } = props;
  const isFavoritesPage = window.location.pathname === '/favorites';
  const state = useLocalObservable(() => ({
    open: false,
    anchorEl: null,
    favorited: isFavoritesPage,
    favoriting: false,
    unfavoriting: false,
  }));

  React.useEffect(() => {
    if (isFavoritesPage) {
      return;
    }
    (async () => {
      try {
        const favorite = await FavoriteApi.get(data.id, {
          viewer: userStore.address
        });
        state.favorited = !!favorite;
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      (async () => {
        await sleep(100);
        state.open = true;
      })();
    }
  }, []);

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

  const handleMenuClose = async () => {
    if (isMobile) {
      state.open = false;
      await sleep(400);
    }
    props.handleMenuClose();
  }

  const onClickDeleteMenu = () => {
    if (props.onClickDeleteMenu) {
      props.onClickDeleteMenu();
    }
  }

  const mute = async (userAddress: string) => {
    confirmDialogStore.show({
      content: lang.youAreSureTo(lang.mute),
      ok: async () => {
        confirmDialogStore.setLoading(true);
        try {
          const block = {
            type: 'Block',
            object: {
              type: 'Person',
              id: userAddress,
            },
          }
          await TrxApi.createActivity(block, groupStore.relationGroup.groupId);
          confirmDialogStore.hide();
          await sleep(400);
          postStore.removePostByUser(userAddress);
          await sleep(400);
          snackbarStore.show({
            message: lang.muted,
          });
        } catch (err) {
          console.log(err);
          confirmDialogStore.hide();
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  }

  const favorite = async () => {
    if (state.favoriting) {
      return;
    }
    state.favoriting = true;
    try {
      const favorite = {
        type: 'Favorite',
        object: {
          type: 'Note',
          id: data.id,
        },
      }
      await TrxApi.createActivity(favorite, data.groupId);
      (async () => {
        await sleep(200);
        snackbarStore.show({
          message: lang.favorited,
        });
      })();
    } catch (err) {
      console.log(err);
      confirmDialogStore.hide();
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.favoriting = false;
  }

  const unfavorite = async () => {
    state.unfavoriting = true;
    try {
      const favorite = {
        type: 'Favorite',
        object: {
          type: 'Note',
          id: data.id,
        },
      }
      await TrxApi.createActivity({ type: 'Undo', object: favorite }, data.groupId);
      (async () => {
        if (isFavoritesPage) {
          await sleep(400);
          postStore.removeFavoritedPost(data.id);
        }
        await sleep(200);
        snackbarStore.show({
          message: lang.done,
        });
      })();
    } catch (err) {
      console.log(err);
      confirmDialogStore.hide();
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.unfavoriting = false;
  }

  if (isMobile) {
    return (
      <DrawerMenu
        open={state.open}
        onClose={handleMenuClose}
        items={[
          {
            invisible: !(userStore.isLogin && type === 'post' && !state.favorited),
            name: lang.favorite + (state.favoriting ? '...' : ''),
            stayOpenAfterClick: true,
            onClick: async () => {
              await favorite();
              handleMenuClose();
            },
          },
          {
            invisible: !(userStore.isLogin && (isFavoritesPage || state.favorited)),
            name: lang.unfavorite + (state.unfavoriting ? '...' : ''),
            className: 'text-red-400 dark:text-red-400',
            stayOpenAfterClick: true,
            onClick: async () => {
              await unfavorite();
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
            invisible: !(userStore.isLogin && userStore.address !== data.userAddress && !isFavoritesPage),
            name: lang.mute,
            className: 'text-red-400 dark:text-red-400',
            onClick: () => {
              handleMenuClose();
              mute(data.userAddress);
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
    )
  }

  return (
    <>
      {userStore.isLogin && type === 'post' && !state.favorited && (
        <MenuItem onClick={async () => {
          await favorite();
          handleMenuClose();
        }}>
          <div className={`flex items-center dark:text-white dark:text-opacity-80 text-gray-600 leading-none pl-1 py-2 font-bold ${state.favoriting ? '' : 'pr-5'}`}>
            <span className={`flex items-center mr-3`}>
              <AiOutlineStar className="text-18 opacity-80" />
            </span>
            {lang.favorite}
            {state.favoriting && <div className="ml-2"><Loading size={12} /></div>}
          </div>
        </MenuItem>
      )}
      {userStore.isLogin && (isFavoritesPage || state.favorited) && (
        <MenuItem onClick={async () => {
          await unfavorite();
          handleMenuClose();
        }}>
          <div className={`flex items-center text-red-400 leading-none pl-1 py-2 font-bold ${state.unfavoriting ? '' : 'pr-5'}`}>
            <span className="flex items-center mr-3">
              <AiOutlineStar className="text-18 opacity-80" />
            </span>
            {lang.unfavorite}
            {state.unfavoriting && <div className="ml-2"><Loading size={12} /></div>}
          </div>
        </MenuItem>
      )}
      <MenuItem onClick={() => {
        copyLink();
        handleMenuClose();
      }}>
        <div className="flex items-center dark:text-white dark:text-opacity-80 text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
          <span className="flex items-center mr-3">
            <AiOutlineLink className="text-18 opacity-80" />
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
        <div className="flex items-center dark:text-white dark:text-opacity-80 text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
          <span className="flex items-center mr-3">
            <MdInfoOutline className="text-18 opacity-80" />
          </span>
          {lang.onChainInfo}
        </div>
      </MenuItem>
      {userStore.isLogin && userStore.address !== data.userAddress && !isFavoritesPage && (
        <div>
          <MenuItem onClick={() => {
            handleMenuClose();
            mute(data.userAddress);
          }}
          >
            <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
              <span className="flex items-center mr-3">
                <BsFillMicMuteFill className="text-18 opacity-80" />
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
                <MdClose className="text-18 opacity-80" />
              </span>
              <span>{lang.delete}</span>
            </div>
          </MenuItem>
        </div>
      )}
    </>
  );
});

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    open: false,
    anchorEl: null,
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
    return (
      <div>
        <div
          className="dark:text-white dark:text-opacity-40 text-gray-af px-[2px] opacity-80 cursor-pointer mt-[1px]"
          onClick={handleMenuClick}
        >
          <RiMoreFill className="text-20" />
        </div>
        {state.open && (
          <Main
            {...props}
            handleMenuClose={handleMenuClose}
            setAnchorEl={(anchorEl: any) => { state.anchorEl = anchorEl; }}
          />
        )}
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
        {state.open && (
          <Main
            {...props}
            handleMenuClose={handleMenuClose}
            setAnchorEl={(anchorEl: any) => { state.anchorEl = anchorEl; }}
          />
        )}
      </Menu>
    </div>
  )
});