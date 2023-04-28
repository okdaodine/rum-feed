import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { PostApi } from 'apis';
import PostItem from 'components/Post/Item';
import { IPost } from 'apis/types';
import { useStore } from 'store';
import { isMobile } from 'utils/env';
import Loading from 'components/Loading';
import { useHistory } from 'react-router-dom';
import Button from 'components/Button';
import TopPlaceHolder, { scrollToTop } from 'components/TopPlaceHolder';
import sleep from 'utils/sleep';

export default observer(() => {
  const { postStore, userStore } = useStore();
  const state = useLocalObservable(() => ({
    post: null as IPost | null,
    loading: false,
    fetched: false,
  }));
  const { id } = useParams() as { id: string };
  const history = useHistory();

  React.useEffect(() => {
    scrollToTop();
    const post = postStore.map[id];
    if (post) {
      if (state.fetched) {
        (async () => {
          state.loading = true;
          await sleep(250);
          state.post = post;
          state.loading = false;
        })();
      } else {
        state.post = post;
        state.loading = false;
        state.fetched = true;
      }
      document.title = post.content.slice(0, 50);
      return;
    }
    (async () => {
      try {
        state.loading = true;
        const post = await PostApi.get(id, {
          viewer: userStore.address
        });
        if (post) {
          state.post = post;
          postStore.tryAddPostToMap(post);
          document.title = post.content.slice(0, 50);
        }
      } catch (err) {
        console.log(err);
      }
      state.loading = false;
      state.fetched = true;
    })();
  }, [id]);

  if (state.loading) {
    return (
      <div className="pt-[30vh] flex justify-center">
        <Loading />
      </div>
    )
  }

  if (!state.fetched) {
    return null;
  }

  if (!state.post) {
    return (
      <div>
        <TopPlaceHolder />
        <div className="pt-[30vh] text-base text-15 md:text-16 text-center dark:text-white dark:text-opacity-80 text-gray-600">
          抱歉，找不到这条内容
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            刷新页面
          </Button>
        </div>
        <div className="mt-4 md:mt-3 text-center">
          <span
            className="dark:text-white dark:text-opacity-80 text-gray-88 cursor-pointer text-12 opacity-90"
            onClick={() => {
              history.push(`/`);
            }}>
            返回首页
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="box-border w-full overflow-y-auto h-screen" id="post-detail-page">
      <TopPlaceHolder />
      <div className="w-full md:w-[600px] box-border mx-auto min-h-screen dark:md-0 md:my-5">
        <div className="dark:md:border dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] rounded-12 overflow-hidden">
          <PostItem
            post={state.post as IPost}
            where="postDetail"
            hideBottom={isMobile}
          />
        </div>
      </div>
    </div>
  )
})