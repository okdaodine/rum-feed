import { IQuote } from 'apis/types';
import { RiDoubleQuotesL, RiDoubleQuotesR } from 'react-icons/ri';
import { AiOutlineLink } from 'react-icons/ai';

export default (props: { quote: IQuote }) => {
  const { quote } = props;
  return (
    <div className="relative rounded-12 pt-[26px] pb-4 pl-5 pr-3 md:pt-6 md:pb-4 md:pl-10 md:pr-6 outline-hidden text-gray-4a/80 dark:text-white/60">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover dark:bg-[left_33px] rounded-12 bg-slate-500/10">
        <div className="absolute inset-0 rounded-12" />
      </div>
      <div className="relative z-10">
        <div className="tracking-wider leading-[1.75] break-words whitespace-pre-wrap">
          {quote.content}
        </div>
        <div className="text-13 mt-3 opacity-70 dark:opacity-60 pr-10 flex">
        {!quote.url && (
          <div className="mr-1">/</div>
        )}
        {quote.url && (
          <AiOutlineLink className="text-16 mr-1 mt-[2px] flex-shrink-0" />
        )}
        {quote.book && (
          <span>
            {quote.author}《{quote.book}》
          </span>
        )}
        {!quote.book && (quote.url || quote.name) && (
          <div className="line-clamp-1">
            {quote.url && (
              <a
                className="hover:underline"
                href={quote.url}
                target="_blank"
                rel="noreferrer"
              >
                {quote.name || quote.url}
              </a>
            )}
            {!quote.url && (
              <span>{quote.name}</span>
            )}
          </div>
        )}
        </div>
      </div>
      <RiDoubleQuotesL className="text-20 md:text-24 opacity-30 absolute top-[6px] md:top-[10px] left-[10px]" />
      <RiDoubleQuotesR className="text-20 md:text-24 opacity-30 absolute bottom-[14px] md:bottom-[14px] right-[10px]" />
    </div>
  )
};