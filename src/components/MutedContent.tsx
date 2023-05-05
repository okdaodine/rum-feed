import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import { lang } from 'utils/lang';

export default observer((props: {
  address: string
  className?: string
  children: React.ReactNode
  disabledUndoMuted?: boolean
  enabledMutedMe?: boolean
}) => {
  const { relationStore } = useStore();
  const muted = relationStore.muted.has(props.address) || (props.enabledMutedMe && relationStore.mutedMe.has(props.address));
  const state = useLocalObservable(() => ({
    muted: muted,
  }));

  if (!state.muted) {
    return <>{props.children}</>;
  }

  return (
    <span className={`italic ${props.className}`}>
      {relationStore.muted.has(props.address) ? (
        <>
          {lang.contentFromMuted}
          {!props.disabledUndoMuted && (
            <span className="text-sky-500 ml-2 cursor-pointer" onClick={() => {
              state.muted = false;
            }}>查看</span>
          )}
        </>
      ) : lang.contentFromMutedMe}
    </span>
  )
})