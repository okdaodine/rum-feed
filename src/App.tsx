import { observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Index from './pages/Index';
import Group from './pages/Group';
import Groups from './pages/Groups';
import Search from './pages/Search';
import PostDetail from './pages/PostDetail';
import User from './pages/User';
import SnackBar from 'components/SnackBar';
import ConfirmDialog from './components/ConfirmDialog';
import { AliveScope } from 'react-activation';
import KeepAlive from 'react-activation'
import CommentReplyModal from 'components/CommentReplyModal';
import PostDetailModal from 'components/PostDetailModal';
import PageLoadingModal from 'components/PageLoadingModal';
import NewFeaturesModal from 'components/NewFeaturesModal';
import { useStore } from 'store';
import GlobalSetup from './globalSetup';
import Preload from './preload';

const App = observer(() => {
  const { groupStore, userStore } = useStore();
  return (
    <Router>
      <AliveScope>
        <div className="dark:bg-[#181818] bg-gray-f7 min-h-screen w-screen">
          <Route path="/groups" exact component={Groups} />

          <Route path="/" component={Preload} />
          {!groupStore.loading && (
            <div>
              <GlobalSetup />
              <Route path="/" exact component={() => (
                <KeepAlive>
                  <Index />
                </KeepAlive>
              )} />
              <Route path="/groups/:groupId" exact render={props => (
                <KeepAlive>
                  <Group { ...props } />
                </KeepAlive>
              )} />
              <Route path="/search" exact component={() => (
                <KeepAlive name='search'>
                  <Search />
                </KeepAlive>
              )} />
              <Route path="/posts/:trxId" exact component={PostDetail} />
              <Route path="/users/:userAddress" exact render={props => (
                <KeepAlive name='user' when={() => (
                  window.location.pathname.startsWith(`/posts`)
                )}>
                  <User { ...props } />
                </KeepAlive>
              )} />
              <PostDetailModal />
              {userStore.isLogin && <CommentReplyModal />}
              {userStore.isLogin && <NewFeaturesModal />}
            </div>
          )}

          <SnackBar />
          <ConfirmDialog />
          <PageLoadingModal />
        </div>
      </AliveScope>
    </Router>
  );
});

export default App;
