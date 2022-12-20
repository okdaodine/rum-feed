import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import PostItem from 'components/Post/Item';
import { PostApi } from 'apis';
import { IPost } from 'apis/types';
import { useStore } from 'store';
import Modal from 'components/Modal';

const PostDetail = observer(() => {
  const { modalStore } = useStore();
  const { trxId } = modalStore.postDetail.data;
  const { postStore, userStore } = useStore();
  const state = useLocalObservable(() => ({
    open: true,
    loading: true,
  }));
  const post = postStore.map[trxId];

  React.useEffect(() => {
    if (post) {
      state.loading = false;
      return;
    }
    (async () => {
      try {
        const post = await PostApi.get(trxId, {
          viewer: userStore.address
        });
        postStore.tryAddPostToMap(post);
      } catch (err) {
        console.log(err);
      }
      state.loading = false;
    })();
  }, []);

  return (
    <div className="">
      <div className="w-full md:w-[600px] box-border mx-auto h-[90vh] md:h-[80vh] relative">
        {!state.loading && (
          <PostItem
            post={post as IPost}
            where="postDetailModal"
          />
        )}
        {!state.loading && !post && (
          <div>
            404 not found
          </div>
        )}
      </div>
      {state.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#181818]">
          <Loading size={24} />
        </div>
      )}
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();

  return (
    <Modal
      open={modalStore.postDetail.open}
      onClose={() => modalStore.postDetail.hide()}
    >
      <PostDetail />
    </Modal>
  )
});
