import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import classNames from 'classnames';
import Loading from 'components/Loading';

import './index.css';

export default observer(() => {
  const { snackbarStore } = useStore();
  const isLarge = (snackbarStore.message || '').length >= 10;

  return (
    <div>
      {snackbarStore.open && (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center snackbar">
          <div
            className={classNames(
              {
                'py-6 md:py-8': isLarge,
              },
              'bg-black p-5 rounded-12 text-white mask dark:border dark:border-white dark:border-opacity-20',
            )}
          >
            <div
              className={classNames(
                {
                  'text-42': isLarge,
                },
                'text-32 flex items-center justify-center pt-1',
              )}
            >
              {snackbarStore.type === 'default' && <FaCheckCircle />}
              {snackbarStore.type === 'error' && <FaTimesCircle />}
              {snackbarStore.type === 'loading' && <Loading size={24} />}
            </div>
            <div
              className={classNames(
                {
                  'box-content mt-4 px-1 md:mt-5 md:px-3 md': isLarge,
                },
                'mt-3 text-15 md:text-16 text-center content md:px-2 md:box-border',
              )}
            >
              {snackbarStore.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
