export default (text: string, options?: { disabled: boolean }) => {
  if (!text) {
    return text;
  }
  const urlRegex = /#[a-zA-Z0-9\u4e00-\u9fa5]+[#\s]{0,1}/g;
  return text.replace(urlRegex, item => {
    try {
      if (item.trim().endsWith('"')) {
        return item;
      }
    } catch(_) {}
    return `<a class="text-sky-500" href="${item.replace(/\s/, '')}" ${options && options.disabled ? 'disabled' : ''}>${item}</a>`
  });
};
