export default (content: string) => content.match(/(https?:\/\/)([\w&@.:/?=-]+)/g) || [];