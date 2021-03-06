import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { SearchItem } from '@cybercongress/gravity';
import { getRankGrade } from '../../utils/search/utils';
import { PATTERN_HTTP } from '../../utils/config';
import CodeBlock from './codeBlock';
import Iframe from 'react-iframe';

const FileType = require('file-type');

const htmlParser = require('react-markdown/plugins/html-parser');

const parseHtml = htmlParser({
  isValidNode: node => node.type !== 'script',
});

const ContentItem = ({ item, cid, nodeIpfs, ...props }) => {
  const [content, setContent] = useState('');
  const [text, setText] = useState(cid);
  const [typeContent, setTypeContent] = useState('');
  const [status, setStatus] = useState('understandingState');
  const [link, setLink] = useState(`/ipfs/${cid}`);

  useEffect(() => {
    const feachData = async () => {
      if (nodeIpfs !== null) {
        const timerId = setTimeout(() => {
          setStatus('impossibleLoad');
          setContent(cid);
        }, 15000);
        const responseDag = await nodeIpfs.dag.get(cid, {
          localResolve: false,
        });
        clearTimeout(timerId);
        if (responseDag.value.size < 1.5 * 10 ** 6) {
          const responseCat = await nodeIpfs.cat(cid);
          const bufs = [];
          bufs.push(responseCat);
          const data = Buffer.concat(bufs);
          const dataFileType = await FileType.fromBuffer(data);
          if (dataFileType !== undefined) {
            const { mime } = dataFileType;
            const dataBase64 = data.toString('base64');
            if (mime.indexOf('image') !== -1) {
              setText(false);
              const file = `data:${mime};base64,${dataBase64}`;
              setTypeContent('image');
              setContent(file);
              setStatus('downloaded');
            } else if (mime.indexOf('application/pdf') !== -1) {
              setText(false);
              const file = `data:${mime};base64,${dataBase64}`;
              setTypeContent('application/pdf');
              setContent(file);
              setStatus('downloaded');
            } else {
              setText(cid);
            }
          } else {
            const dataBase64 = data.toString();
            if (dataBase64.length > 42) {
              setLink(`/ipfs/${cid}`);
            } else {
              setLink(`/search/${dataBase64}`);
            }
            if (dataBase64.length > 300) {
              setText(`${dataBase64.slice(0, 300)}...`);
            } else {
              setText(dataBase64);
            }
            if (dataBase64.match(PATTERN_HTTP)) {
              setTypeContent('link');
            } else {
              setTypeContent('text');
            }
            setStatus('downloaded');
            setContent(dataBase64);
          }
        } else {
          setStatus('availableDownload');
          setText(cid);
        }
      } else {
        setText(cid);
        setStatus('impossibleLoad');
      }
    };
    feachData();
  }, [cid, nodeIpfs]);

  return (
    <Link {...props} to={link}>
      <SearchItem
        key={cid}
        text={
          <div className="container-text-SearchItem">
            <ReactMarkdown
              source={text}
              escapeHtml={false}
              skipHtml={false}
              astPlugins={[parseHtml]}
              renderers={{ code: CodeBlock }}
              // plugins={[toc]}
              // escapeHtml={false}
            />
          </div>
        }
        status={status}
        rank={item.rank ? item.rank : 'n/a'}
        grade={
          item.rank
            ? getRankGrade(item.rank)
            : { from: 'n/a', to: 'n/a', value: 'n/a' }
        }
      >
        {typeContent === 'image' && (
          <img
            style={{ width: '100%', paddingTop: 10 }}
            alt="img"
            src={content}
          />
        )}
        {typeContent === 'application/pdf' && (
          <Iframe
            width="100%"
            height="400px"
            className="iframe-SearchItem"
            url={content}
          />
        )}
      </SearchItem>
    </Link>
  );
};

export default ContentItem;
