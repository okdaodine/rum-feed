import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { debounce, sumBy } from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import { Tooltip } from '@material-ui/core';
import { BiSmile } from 'react-icons/bi';
import { BsImage } from 'react-icons/bs';
import Uploady from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';
import UploadDropZone from '@rpldy/upload-drop-zone';
import withPasteUpload from '@rpldy/upload-paste';
import UploadPreview, { PreviewItem } from '@rpldy/upload-preview';
import { IoMdClose } from 'react-icons/io';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Avatar from 'components/Avatar';
import { EmojiPicker } from 'components/EmojiPicker';
import { lang } from 'utils/lang';
import Base64 from 'utils/base64';
import { useStore } from 'store';
import openPhotoSwipe from 'components/openPhotoSwipe';
import { v4 as uuid } from 'uuid';
import sleep from 'utils/sleep';
import { IPost } from 'apis/types';
import { IImage } from 'apis/types/common';
import openLoginModal from 'components/Wallet/openLoginModal';
import { isMobile, isPc } from 'utils/env';
import LinkCard from 'components/LinkCard';
import extractUrls from 'utils/extractUrls';
import RetweetItem from 'components/Post/RetweetItem';
import isRetweetUrl from 'utils/isRetweetUrl';
import { PostApi } from 'apis';

import './index.css';

interface IPreviewItem extends PreviewItem {
  kbSize: number
}

export interface IDraft {
  content: string
  images?: IPreviewItem[]
}

type ISubmitData = {
  content: string
  images?: IImage[]
  retweet?: IPost
};

interface IProps {
  retweet?: IPost
  groupId: string
  editorKey: string
  placeholder: string
  submit: (data: ISubmitData) => unknown
  minRows?: number
  classNames?: string
  buttonClassName?: string
  smallSize?: boolean
  autoFocus?: boolean
  autoFocusDisabled?: boolean
  hideButtonDefault?: boolean
  enabledImage?: boolean
  disabledEmoji?: boolean
  imageLimit?: number
  buttonBorder?: () => void
  submitButtonText?: string
  imagesClassName?: string
  enabledProfile?: boolean
}

const Images = (props: {
  images: IPreviewItem[]
  removeImage: (id: string) => void
  smallSize?: boolean
}) => {
  if (props.images.length === 0) {
    return null;
  }
  return (
    <div className="flex items-center py-1">
      {props.images.map((image: IPreviewItem, index: number) => (
        <div
          className="relative animate-fade-in"
          key={image.id}
          onClick={() => {
            openPhotoSwipe({
              image: props.images.map((image: IPreviewItem) => image.url),
              index,
            });
          }}
        >
          <div
            className={classNames({
              'w-14 h-14': props.smallSize,
              'w-24 h-24': !props.smallSize,
            }, 'mr-2 rounded-4')}
            style={{
              background: `url(${image.url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
          />
          <div
            className={classNames({
              'w-6 h-6 right-[12px]': !props.smallSize,
              'w-5 h-5 right-[10px]': props.smallSize,
            }, 'bg-black bg-opacity-70 dark:text-black text-white opacity-80 text-14 top-[3px] absolute cursor-pointer rounded-full flex items-center justify-center')}
            onClick={(e: any) => {
              e.stopPropagation();
              props.removeImage(image.id);
            }}
          >
            <IoMdClose />
          </div>
        </div>
      ))}
    </div>
  );
};

const extensions = ['jpg', 'jpeg', 'png', 'gif'];
const ACCEPT = extensions.map((v) => `.${v}`).join(', ');

export default (props: IProps) => {
  const PasteUploadDropZone = withPasteUpload(UploadDropZone);
  if (props.enabledImage) {
    return (
      <Uploady multiple accept={isPc ? ACCEPT : undefined}>
        <PasteUploadDropZone>
          <Editor {...props} />
        </PasteUploadDropZone>
      </Uploady>
    );
  }
  return <Editor {...props} />;
};

const Editor = observer((props: IProps) => {
  const { snackbarStore, userStore, groupStore } = useStore();
  const draftKey = `${props.editorKey.toUpperCase()}_DRAFT_${props.groupId}` + (props.retweet ? `_${props.retweet.id}` : '');
  const state = useLocalObservable(() => ({
    content: '',
    submitting: false,
    fetchedProfile: false,
    clickedEditor: false,
    emoji: false,
    cacheImageIdSet: new Set(''),
    imageMap: {} as Record<string, IPreviewItem>,
    retweetUrl: '',
    retweet: props.retweet || null as IPost | null,
    lastUrl: '',
    enabledDraftListener: false
  }));
  const emojiButton = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isPastingFileRef = React.useRef<boolean>(false);
  const imageCount = Object.keys(state.imageMap).length;
  const imageIdSet = React.useMemo(() => new Set(Object.keys(state.imageMap)), [imageCount]);
  const readyToSubmit = ((state.content.trim() || imageCount > 0) && !state.submitting) || !!props.retweet;
  const imageLImit = props.imageLimit || 4;
  const alertedPreviewsRef = React.useRef<string[]>([]);
  const enabledLinkPreview = props.editorKey === 'post';

  React.useEffect(() => {
    (async () => {
      await sleep(1000);
      const draft = localStorage.getItem(draftKey);
      if (!draft) {
        return;
      }
      const draftObj = JSON.parse(draft);
      if (!draftObj.content && (draftObj.images || []).length === 0) {
        return;
      }
      state.content = draftObj.content || '';
      if (props.enabledImage) {
        for (const image of draftObj.images as IPreviewItem[]) {
          state.imageMap[image.id] = image;
        }
      }
    })();
  }, []);

  React.useEffect(() => {
    if (state.enabledDraftListener) {
      saveDraft({
        content: state.content,
        images: Object.values(state.imageMap),
      });
    }
    getUrls(state.content);
  }, [state.content, imageIdSet]);

  React.useEffect(() => {
    (async () => {
      await sleep(3000);
      state.enabledDraftListener = true;
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      await sleep(50);
      if ((props.minRows || 0) > 1 && textareaRef.current) {
        textareaRef.current.click();
      }
    })();
  }, []);

  const saveDraft = React.useCallback(
    debounce((draft: IDraft) => {
      if (state.submitting) {
        return;
      }
      if (!draft.content && (draft.images || []).length === 0 && !localStorage.getItem(draftKey)) {
        return;
      }
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 300),
    [],
  );

  const getUrls = React.useCallback(
    debounce((content: string) => {
      if (enabledLinkPreview && !props.retweet) {
        const urls = extractUrls(content || '').reverse();
        if (urls.length > 0) {
          state.lastUrl = urls[0] || '';
        } else {
          state.lastUrl = '';
        }
        state.retweetUrl = urls.find(url => isRetweetUrl(url)) || '';
        if (state.retweetUrl) {
          (async () => {
            try {
              const retweetId = new URL(state.retweetUrl).pathname.split('/')[2] || '';
              state.retweet = await PostApi.get(retweetId, { viewer: undefined });
            } catch (err) {
              console.log(err);
            }
          })();
        } else {
          state.retweet = null;
        }
      }
    }, 800),
    [],
  );

  const handleInsertEmoji = action((e: string) => {
    if (!textareaRef.current) {
      return;
    }
    const start = textareaRef.current.selectionStart;

    state.content = state.content.slice(0, start)
      + e
      + state.content.slice(textareaRef.current.selectionEnd);
    setTimeout(() => {
      textareaRef.current!.setSelectionRange(start + e.length, start + e.length);
      textareaRef.current!.focus();
    });
  });

  const submit = async () => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    if (!readyToSubmit) { return; }
    if (state.content.length > 5000) {
      snackbarStore.show({
        message: lang.requireMaxLength(lang.object, 5000),
        type: 'error',
        duration: 2500,
      });
      return;
    }
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    const payload: ISubmitData = {
      content: state.content.trim()
    };
    if (props.enabledImage && imageIdSet.size > 0) {
      const images = await Promise.all(Object.values(state.imageMap).map(async (image: IPreviewItem) => {
        let url = image.url;
        if (!url.startsWith('data:')) {
          const res: any = await Base64.getFromBlobUrl(url);
          url = res.url;
        }
        return {
          mediaType: Base64.getMimeType(url),
          content: Base64.getContent(url),
          name: image.name,
        }
      }));
      payload.images = images;
    }
    if (state.retweet) {
      payload.retweet = state.retweet;
      if (props.retweet && !payload.content.includes(`/posts/${props.retweet.id}`)) {
        payload.content += `${payload.content ? ' ' : ''}${window.location.origin}/posts/${props.retweet.id}`;
      }
    }
    let _draft = localStorage.getItem(draftKey) || '';
    localStorage.removeItem(draftKey);
    try {
      await props.submit(payload);
      state.content = '';
      if (props.enabledImage) {
        for (const prop of Object.keys(state.imageMap)) {
          delete state.imageMap[prop];
        }
      }
    } catch (err: any) {
      state.submitting = false;
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
      if (_draft) {
        localStorage.setItem(draftKey, _draft);
      }
    }
    state.submitting = false;
  };

  const onChange = (e: any) => {
    if (isPastingFileRef.current) {
      return;
    }
    state.content = e.target.value;
  }

  const onPaste = (e: any) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === 'file') {
        isPastingFileRef.current = true;
        setTimeout(() => {
          isPastingFileRef.current = false;
        }, 500);
        return;
      }
    }
  }

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      submit();
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-start">
        {props.enabledProfile && (
          <Avatar
            className="block mr-[14px] mt-[1px] flex-none"
            url={userStore.profile.avatar}
            size={36}
          />
        )}
        <div className="w-full">
          <div
            className="relative"
            onClick={() => {
              state.clickedEditor = true;
            }}
          >
            {isPc && (
              <TextareaAutosize
                className={classNames(
                  {
                    sm: props.smallSize,
                  },
                  `w-full textarea-autosize rounded-[8px] min-rows-${props.minRows || 2}`,
                  props.classNames,
                )}
                ref={textareaRef}
                placeholder={props.placeholder}
                minRows={props.minRows || 2}
                value={state.content}
                autoFocus={props.autoFocus || false}
                onChange={onChange}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
              />
            )}
            {isMobile && (
              <div className="pb-2">
                <TextField
                  multiline
                  fullWidth
                  inputRef={textareaRef}
                  placeholder={props.placeholder}
                  minRows={5}
                  maxRows={8}
                  value={state.content}
                  autoFocus={props.autoFocus || false}
                  onChange={onChange}
                  onPaste={onPaste}
                  onKeyDown={onKeyDown}
                  margin="none"
                  variant="outlined"
                  inputProps={{ maxLength: 8000 }}
                />
              </div>
            )}
            {state.submitting && (
              <div className="absolute top-0 left-0 w-full z-10 bg-white dark:bg-[#181818] opacity-70 flex items-center justify-center h-full">
                <div className="mt-[-6px]">
                  <Loading
                    size={props.minRows && props.minRows > 1 ? 22 : 16}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {props.enabledImage && (
        <div className={classNames({
          'opacity-50': state.submitting,
        }, props.imagesClassName || '')}
        >
          <Images
            images={Object.values(state.imageMap)}
            removeImage={(id: string) => {
              delete state.imageMap[id];
            }}
            smallSize={props.smallSize}
          />
          <UploadPreview
            PreviewComponent={() => null}
            onPreviewsChanged={async (previews: PreviewItem[]) => {
              const newPreviews = previews.filter((preview: PreviewItem) => {
                const ext = (preview.name || '').split('.').pop()?.toLowerCase() || '';
                console.log(preview);
                if (!extensions.includes(ext)) {
                  if (!alertedPreviewsRef.current.includes(preview.name)) {
                    alertedPreviewsRef.current.push(preview.name);
                    snackbarStore.show({
                      message: `${lang.notSupport} ${ext} (${preview.name})`,
                      type: 'error',
                      duration: 3000
                    });
                  }
                }
                return !state.cacheImageIdSet.has(preview.id) && (extensions.includes(ext));
              });
              const total = newPreviews.length + imageIdSet.size;
              if (total > imageLImit) {
                for (const preview of newPreviews) {
                  preview.id = uuid();
                  state.cacheImageIdSet.add(preview.id);
                }
                snackbarStore.show({
                  message: lang.maxImageCount(imageLImit),
                  type: 'error',
                });
                return;
              }
              if (newPreviews.length > 0) {
                const images = await Promise.all(newPreviews.map(async (preview: PreviewItem) => {
                  const imageData = (await Base64.getFromBlobUrl(preview.url, 45 + 10 * (imageLImit - total))) as { url: string, kbSize: number };
                  return {
                    ...preview,
                    name: `${uuid()}_${preview.name}`,
                    url: imageData.url,
                    kbSize: imageData.kbSize,
                  };
                }));
                const curKbSize = sumBy(Object.values(state.imageMap), (image: IPreviewItem) => image.kbSize);
                const newKbSize = sumBy(images, (image: IPreviewItem) => image.kbSize);
                const totalKbSize = curKbSize + newKbSize;
                images.forEach((image) => {
                  state.cacheImageIdSet.add(image.id);
                });
                console.log({ totalKbSize });
                if (totalKbSize > 800) {
                  snackbarStore.show({
                    message: lang.maxByteLength,
                    type: 'error',
                    duration: 3500,
                  });
                  return;
                }
                images.forEach((image, index) => {
                  state.imageMap[images[index].id] = image;
                });
              }
            }}
          />
        </div>
      )}
      {state.retweet && (
        <div className="pb-1">
          <RetweetItem post={state.retweet} small={isMobile} disabledClick  />
        </div>
      )}
      {!state.retweetUrl && !state.retweet && state.lastUrl && (
        <LinkCard url={state.lastUrl} />
      )}
      {(state.clickedEditor
        || imageCount > 0
        || props.autoFocus
        || !props.hideButtonDefault
        || (props.minRows && props.minRows > 1)) && (
        <div>
          <div className="mt-1 flex justify-between">
            <div className="flex items-center">
              {!props.disabledEmoji && (
                <div
                  className={classNames(
                    !props.enabledProfile && 'ml-1',
                    !!props.enabledProfile && 'ml-12',
                  )}
                  ref={emojiButton}
                >
                  <BiSmile
                    className="mr-4 text-22 cursor-pointer dark:text-white dark:text-opacity-80 text-gray-af"
                    onClick={action(() => { state.emoji = true; })}
                  />
                </div>
              )}
              {props.enabledImage && (
                <div className="flex items-center">
                  <UploadButton>
                    <BsImage
                      className="text-18 cursor-pointer dark:text-white dark:text-opacity-80 text-gray-af"
                    />
                  </UploadButton>
                </div>
              )}
              {!props.disabledEmoji && (
                <EmojiPicker
                  open={state.emoji}
                  anchorEl={emojiButton.current}
                  onSelectEmoji={handleInsertEmoji}
                  onClose={action(() => { state.emoji = false; })}
                />
              )}
              {groupStore.multiple && props.editorKey === 'post' && (
                <div className="flex ml-5 mt-[2px] tracking-wider">
                  <Tooltip
                    enterDelay={600}
                    enterNextDelay={600}
                    placement="top"
                    title={lang.submitContentToHere}
                    arrow
                    >
                    <div className="bg-[#e3e5e6] bg-opacity-60 dark:bg-opacity-10 text-12 py-[2px] px-2 flex items-center rounded-full">
                      <div className="w-[10px] h-[10px] bg-[#37434D] rounded-full mr-[6px] opacity-30 dark:bg-white dark:opacity-30" />
                      <span className="text-[#37434D] opacity-[0.6] font-bold dark:text-white dark:opacity-50">{groupStore.map[props.groupId]?.groupName}</span>
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
            <Tooltip
              enterDelay={2000}
              enterNextDelay={2000}
              placement="left"
              title={`${lang.shortcut}: Ctrl + Enter, Cmd + Enter`}
              arrow
              interactive
            >
              <div className={props.buttonClassName || ''}>
                <Button
                  size={isMobile ? 'large' : 'small'}
                  className={classNames({
                    'dark:opacity-50 opacity-30': !readyToSubmit,
                  })}
                  onClick={submit}
                >
                  {props.submitButtonText || (props.retweet ? lang.retweet : lang.publish)}
                </Button>
              </div>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
});
