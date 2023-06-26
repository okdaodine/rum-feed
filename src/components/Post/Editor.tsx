import { observer } from 'mobx-react-lite';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import { IPost, IUploadVideoRes } from 'apis/types';
import { TrxStorage } from 'apis/common';
import { TrxApi } from 'apis';
import { useStore } from 'store';
import { toJS } from 'mobx';
import openLoginModal from 'components/Wallet/openLoginModal';
import { IActivity } from 'rum-sdk-browser';
import Base64 from 'utils/base64';
import { IImage } from 'apis/image';
import { v4 as uuid } from 'uuid';
import sleep from 'utils/sleep';
import { API_ORIGIN } from 'apis/common';
import pick from 'lodash/pick';

export default observer((props: {
  groupId: string
  retweet?: IPost
  callback: (post: IPost) => void
  autoFocus?: boolean
  autoFocusDisabled?: boolean
  minRows: number
  disabledEmoji?: boolean
}) => {
  const { userStore, groupStore, configStore, snackbarStore } = useStore();
  const { groupId } = props;
  const group = groupStore.map[groupId];

  const submitPost = async (activity: IActivity, retweet?: IPost) => {
    if (!userStore.isLogin) {
      openLoginModal();
      return;
    }
    const res = await TrxApi.createActivity(activity, groupId);
    const post: IPost = {
      content: activity.object?.content || '',
      images: ((activity.object?.image as []) || []).map(image => Base64.getUrl(image as any as IImage)),
      userAddress: userStore.address,
      groupId,
      trxId: res.trx_id,
      id: activity.object?.id ?? '',
      storage: TrxStorage.cache,
      commentCount: 0,
      likeCount: 0,
      imageCount: ((activity.object?.image as []) || []).length,
      timestamp: Date.now(),
      extra: {
        userProfile: toJS(userStore.profile),
        groupName: group.groupName
      }
    };
    if (retweet) {
      post.extra.retweet = retweet;
    }
    if (activity.object?.attachment) {
      const video = (activity.object?.attachment as any)[0];
      post.video = {
        url: `${API_ORIGIN}/${video.id}`,
        poster: `${API_ORIGIN}/${video.id.replace('mp4', 'jpg')}`,
        duration: video.duration,
        width: video.width,
        height: video.height,
      }
    }
    if (activity.object?.quote) {
      post.quote = pick(activity.object.quote, [
        'content',
        'book',
        'author',
        'name',
        'url',
      ]);
    }
    props.callback(post);
  }

  const submitVideo = async (video: IUploadVideoRes) => {
    const manyChunks = video.chunks.length > 1;
    try {
      for (const [index, chunk] of Object.entries(video.chunks)) {
        if (manyChunks) {
          const percent = Math.round((Number(index) + 1) / video.chunks.length * 100);
          snackbarStore.show({ message: `${lang.processing} ${percent}%`, duration: 9999999, type: 'loading' });
        }
        const activity = {
          type: 'Create',
          object: {
            type: 'Video',
            id: `${video.fileName}.part${Number(index) + 1}`,
            content: chunk,
            mediaType: video.mimetype,
            duration: video.duration,
            width: video.width,
            height: video.height,
            totalItems: video.chunks.length,
          }
        } as IActivity;
        await TrxApi.createActivity(activity, groupStore.videoGroup.groupId);
      }
    } catch (err) {
      throw err;
    }
    if (manyChunks) {
      await sleep(100);
      snackbarStore.close();
    }
  }

  return (
    <Editor
      retweet={props.retweet}
      groupId={group.groupId}
      editorKey="post"
      placeholder={lang.whatsHappening}
      autoFocus={props.autoFocus}
      autoFocusDisabled={props.autoFocusDisabled}
      minRows={props.minRows}
      submit={async (data) => {
        const payload: IActivity = {
          type: 'Create', 
          object: {
            type: 'Note',
            id: uuid(),
            content: data.content,
          }
        };
        if (data.images) {
          payload.object!.image = data.images.map(v => ({
            type: 'Image',
            mediaType: v.mediaType,
            content: v.content,
          }));
        }
        if (data.video) {
          payload.object!.attachment = [{
            type: 'Video',
            id: data.video.fileName,
            duration: data.video.duration,
            width: data.video.width,
            height: data.video.height,
          }];
          await submitVideo(data.video);
        }
        if (data.quote) {
          payload.object!.quote = {
            type: 'Quote',
            ...pick(data.quote, [
              'content',
              'book',
              'author',
              'name',
              'url',
            ])
          }
        }
        return submitPost(payload, data.retweet);
      }}
      enabledImage
      enabledVideo={configStore.config.enabledVideo}
      disabledEmoji={props.disabledEmoji}
    />
  )
});
