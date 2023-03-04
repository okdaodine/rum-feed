
import { observer } from 'mobx-react-lite';
import Button from 'components/Button';
import Modal from 'components/Modal';
import sleep from 'utils/sleep';
import { useHistory } from 'react-router-dom';
import { lang } from 'utils/lang';
import { AiOutlineSearch } from 'react-icons/ai';
import openContractModal from 'components/openContractModal';
import { useStore } from 'store';

interface IProps {
  open: boolean
  onClose: () => void
}

const UserList = observer((props: IProps) => {
  const { groupStore } = useStore();
  const history = useHistory();
  const groups = groupStore.groups.filter(group => group.groupId !== groupStore.defaultGroup.groupId)

  return (
    <div className="bg-white dark:bg-[#181818] rounded-12 dark:text-white dark:text-opacity-80 text-gray-4a">
      <div className="px-5 py-5 leading-none text-18 border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-d8 border-opacity-75 flex justify-between items-center font-bold">
        Find your NFT club
        <div className="cursor-pointer text-24 px-2" onClick={() => openContractModal()}>
          <AiOutlineSearch />
        </div>
      </div>
      <div className="w-full md:w-[350px] h-[80vh] md:h-[400px] overflow-y-auto">
        {groups.map((group) => {
          return (
            <div
              className="border-b dark:border-white dark:md:border-opacity-10 dark:border-opacity-[0.05] border-gray-200 py-3 px-6 flex items-center justify-between"
              key={group.groupName}
            >
              <div>
                {/* <img
                  className="w-10 h-10 rounded-full"
                  src={group.extra.userProfile.avatar}
                  alt={group.extra.userProfile.name}
                /> */}
                <div className="text-16 font-bold tracking-wider w-[230px] truncate">{group.groupAlias}</div>
                <div className="text-12 mt-1 opacity-60 tracking-wider">
                  {lang.synced}<span className="font-bold mx-[6px]">{group.contentCount}</span>{lang.contents}
                </div>
              </div>
              <Button
                size="small"
                outline 
                onClick={async () => {
                  props.onClose();
                  await sleep(200);
                  history.push(`/groups/${group.groupName}`);
                }}>
                {lang.open}
              </Button>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="py-28 text-center text-14 dark:text-white dark:text-opacity-80 text-gray-400 opacity-80">
            {lang.empty}
          </div>
        )}
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideCloseButton
    >
      <UserList { ...props } />
    </Modal>
  );
});
