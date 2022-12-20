import { observer } from 'mobx-react-lite';
import { ImInfo } from 'react-icons/im';
import openTrxModal from 'components/openTrxModal';

export default observer((props: {
  groupId: string
  trxId: string
}) => (
  <div className="relative w-[18px] h-[14px]">
    <div
      className="absolute top-[-1px] left-0 dark:text-white dark:text-opacity-80 text-gray-af px-[2px] cursor-pointer"
      onClick={() => openTrxModal(props)}
    >
      <ImInfo className="text-15" />
    </div>
  </div>
));
