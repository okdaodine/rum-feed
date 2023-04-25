module.exports = (url) => {
  const { pathname } = new URL(url);
  const uuid = pathname.split('/')[2];
  return pathname.startsWith('/posts/') && isUUID(uuid) && !url.includes('commentId');
};

function isUUID(str) {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return pattern.test(str);
}
