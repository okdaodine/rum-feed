import React from 'react';
import type { AppProps } from 'next/app';
import { StoreProvider } from 'store';
import Preload from 'preload';
import GlobalSetup from 'globalSetup';
import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoadingModal from 'components/PageLoadingModal';

import 'index.css';

import 'components/Button/index.css';
import 'components/Comment/item.css';
import 'components/Comment/Mobile/index.css';
import 'components/Comment/Mobile/item.css';
import 'components/Comment/Mobile/items.css';
import 'components/DrawerModal/index.css';
import 'components/Editor/index.css';
import 'components/EmojiPicker/index.css';
import 'components/ImageEditor/index.css';
import 'components/Notification/index.css';
import 'components/Post/index.css';
import 'components/SearchInput/index.css';
import 'components/SnackBar/index.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StoreProvider>
      <div className="dark:bg-[#181818] bg-gray-f7 min-h-screen w-screen">
        <Preload />
        <GlobalSetup />

        <Component {...pageProps} />

        <SnackBar />
        <ConfirmDialog />
        <PageLoadingModal />
      </div>
    </StoreProvider>
  )
}
