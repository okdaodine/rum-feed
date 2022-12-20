export default () => {
  return (
    <div id="top-placeholder" className="h-[40px] md:h-[42px]" />
  )
};

export const scrollToTop = () => {
  const element = document.querySelector('#top-placeholder');
  if (element) {
    element.scrollIntoView();
  }
}