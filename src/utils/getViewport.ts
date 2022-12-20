export default () => {
  if ((window as any).visualViewport) {
    return {
      width: (window as any).visualViewport.width,
      height: (window as any).visualViewport.height
    };
  }
  return {
    width: (window as any).innerWidth || (document.scrollingElement || document.documentElement).clientWidth,
    height: (window as any).innerHeight || (document.scrollingElement || document.documentElement).clientHeight
  };
}
