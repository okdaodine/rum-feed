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
    const trimmedText = item.length > 32 ? `${item.slice(0, 32)}...` : item;
    return `<a class="text-sky-500" href="${item}" ${options && options.disabled ? 'disabled' : ''}>${trimmedText}</a>`
  });
};
