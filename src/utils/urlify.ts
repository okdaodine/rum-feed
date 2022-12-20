export default (text: string, options?: { disabled: boolean }) => {
  if (!text) {
    return text;
  }
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, item => {
    try {
      if (item.trim().endsWith('"')) {
        return item;
      }
    } catch(_) {}
    return `<a class="text-sky-500" href="${item}" ${options && options.disabled ? 'disabled' : ''}>查看链接</a>`
  });
};
