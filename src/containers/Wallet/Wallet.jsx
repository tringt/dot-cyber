import React from 'react';
import { connect } from 'react-redux';
import { Pane, Text, Tooltip, Icon } from '@cybercongress/gravity';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import Web3Utils from 'web3-utils';
import { Link } from 'react-router-dom';
import { Loading, ConnectLadger, Copy, LinkWindow } from '../../components';
import NotFound from '../application/notFound';
import ActionBarContainer from './actionBarContainer';
import { setBandwidth } from '../../redux/actions/bandwidth';
import withWeb3 from '../../components/web3/withWeb3';

import { LEDGER, COSMOS } from '../../utils/config';
import {
  getBalance,
  getTotalEUL,
  getImportLink,
  getAccountBandwidth,
  getGraphQLQuery,
} from '../../utils/search/utils';
import { PocketCard } from './components';
import {
  PubkeyCard,
  GolCard,
  ImportLinkLedger,
  GolBalance,
  TweetCard,
} from './card';
import ActionBarTweet from './actionBarTweet';

const {
  HDPATH,
  LEDGER_OK,
  LEDGER_NOAPP,
  STAGE_INIT,
  STAGE_LEDGER_INIT,
  STAGE_READY,
  STAGE_ERROR,
  LEDGER_VERSION_REQ,
} = LEDGER;

const QueryAddress = address =>
  `
  query MyQuery {
    cyberlink(where: {subject: {_eq: "${address}"}}) {
      object_from
      object_to
    }
  }`;

function flatten(data, outputArray) {
  data.forEach(element => {
    if (Array.isArray(element)) {
      flatten(element, outputArray);
    } else {
      outputArray.push(element);
    }
  });
}

const comparer = otherArray => {
  return current => {
    return (
      otherArray.filter(other => {
        return (
          other.object_from === current.from && other.object_to === current.to
        );
      }).length === 0
    );
  };
};

const groupLink = linkArr => {
  const link = [];
  const size = 7;
  for (let i = 0; i < Math.ceil(linkArr.length / size); i += 1) {
    link[i] = linkArr.slice(i * size, i * size + size);
  }
  return link;
};

class Wallet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: STAGE_INIT,
      pocket: [],
      refreshTweet: 0,
      ledger: null,
      returnCode: null,
      addressInfo: null,
      addressLedger: null,
      ledgerVersion: [0, 0, 0],
      time: 0,
      addAddress: false,
      loading: true,
      accounts: null,
      accountsETH: null,
      link: null,
      selectedIndex: '',
      importLinkCli: false,
      linkSelected: null,
      selectCard: '',
      balanceEthAccount: {
        eth: 0,
        gol: 0,
      },
    };
  }

  async componentDidMount() {
    const { accounts, web3 } = this.props;

    await this.setState({
      accountsETH: accounts,
    });

    if (accounts && accounts !== null) {
      this.getBalanceEth();
    }

    await this.checkAddressLocalStorage();
    if (web3.givenProvider !== null) {
      this.accountsChanged();
    }
  }

  accountsChanged = () => {
    window.ethereum.on('accountsChanged', async accountsChanged => {
      const defaultAccounts = accountsChanged[0];
      const tmpAccount = defaultAccounts;
      this.setState({
        accountsETH: tmpAccount,
      });
      this.getBalanceEth();
    });
  };

  getBalanceEth = async () => {
    const { accountsETH } = this.state;
    const { web3, contractToken } = this.props;
    const balanceEthAccount = {
      eth: 0,
      gol: 0,
    };
    console.log(accountsETH);

    if (accountsETH && accountsETH !== null) {
      const responseGol = await contractToken.methods
        .balanceOf(accountsETH)
        .call();
      balanceEthAccount.gol = responseGol;
      const responseEth = await web3.eth.getBalance(accountsETH);
      const eth = Web3Utils.fromWei(responseEth, 'ether');
      balanceEthAccount.eth = eth;
    }

    this.setState({
      balanceEthAccount,
    });
  };

  checkAddressLocalStorage = async () => {
    const { setBandwidthProps } = this.props;
    let address = [];

    const localStorageStory = await localStorage.getItem('pocket');
    if (localStorageStory !== null) {
      address = JSON.parse(localStorageStory);
      console.log('address', address);
      this.setState({
        accounts: address,
        link: null,
        selectedIndex: '',
        importLinkCli: false,
        linkSelected: null,
        selectCard: '',
      });
      this.getLocalStorageLink();
      this.getAddressInfo();
    } else {
      setBandwidthProps(0, 0);

      this.setState({
        addAddress: true,
        stage: STAGE_INIT,
        loading: false,
        pocket: [],
        ledger: null,
        returnCode: null,
        addressInfo: null,
        addressLedger: null,
        ledgerVersion: [0, 0, 0],
        time: 0,
        accounts: null,
        link: null,
        selectedIndex: '',
        importLinkCli: false,
        linkSelected: null,
        selectCard: '',
      });
    }
  };

  getLocalStorageLink = async () => {
    const { accounts } = this.state;
    const localStorageStoryLink = localStorage.getItem('linksImport');
    let linkUser = [];
    const dataLink = await getGraphQLQuery(QueryAddress(accounts.cyber.bech32));

    if (dataLink.cyberlink && dataLink.cyberlink.length > 0) {
      linkUser = dataLink.cyberlink;
    }

    if (localStorageStoryLink === null) {
      this.getLink(linkUser);
    } else {
      const linkData = JSON.parse(localStorageStoryLink);
      if (linkData.length > 0) {
        const flattened = [];

        flatten(linkData, flattened);
        let onlyInB = [];
        if (linkUser.length > 0) {
          onlyInB = flattened.filter(comparer(linkUser));
        }
        if (onlyInB.length > 0) {
          const link = groupLink(onlyInB);
          this.setState({ link });
        } else {
          this.setState({ link: null });
        }
      } else {
        this.setState({ link: null });
      }
    }
  };

  getLink = async dataLinkUser => {
    const { accounts } = this.state;
    const dataLink = await getImportLink(accounts.cyber.bech32);
    let link = [];

    if (dataLink !== null) {
      let onlyInB = [];
      if (dataLinkUser.length > 0) {
        onlyInB = dataLink.filter(comparer(dataLinkUser));
      }
      if (onlyInB.length > 0) {
        link = groupLink(onlyInB);
      }

      localStorage.setItem('linksImport', JSON.stringify(link));
      if (link.length > 0) {
        this.setState({
          link,
        });
      } else {
        this.setState({
          link: null,
        });
      }
    }
  };

  getAddressInfo = async () => {
    const { accounts } = this.state;
    const { setBandwidthProps } = this.props;

    const pocket = {};
    const addressInfo = {
      address: '',
      amount: '',
      token: '',
    };
    const responseCyber = await getBalance(accounts.cyber.bech32);
    const responseBandwidth = await getAccountBandwidth(accounts.cyber.bech32);
    const responseCosmos = await getBalance(
      accounts.cosmos.bech32,
      COSMOS.GAIA_NODE_URL_LSD
    );

    if (responseBandwidth !== null) {
      const { remained, max_value: maxValue } = responseBandwidth;
      setBandwidthProps(remained, maxValue);
    }

    const totalCyber = await getTotalEUL(responseCyber);
    pocket.cyber = {
      address: accounts.cyber.bech32,
      amount: totalCyber.total,
      token: 'eul',
    };
    const totalCosmos = await getTotalEUL(responseCosmos);
    pocket.cosmos = {
      address: accounts.cosmos.bech32,
      amount: totalCosmos.total / COSMOS.DIVISOR_ATOM,
      token: 'atom',
    };

    pocket.pk = accounts.cyber.pk;
    pocket.keys = accounts.keys;

    console.log(pocket);

    this.setState({
      pocket,
      stage: STAGE_READY,
      addAddress: false,
      loading: false,
      addressInfo,
    });
  };

  cleatState = () => {
    this.setState({
      stage: STAGE_INIT,
      table: [],
      ledger: null,
      returnCode: null,
      addressInfo: null,
      addressLedger: null,
      ledgerVersion: [0, 0, 0],
      time: 0,
      addAddress: true,
    });
  };

  onClickImportLink = () => {
    const { importLinkCli, selectCard } = this.state;
    let select = 'importCli';

    if (selectCard === 'importCli') {
      select = '';
    }

    this.setState({
      linkSelected: null,
      selectedIndex: '',
      selectCard: select,
      importLinkCli: !importLinkCli,
    });
  };

  selectLink = (link, index) => {
    const { linkSelected, selectedIndex } = this.state;

    let selectLink = null;

    this.setState({
      importLinkCli: false,
    });

    if (selectedIndex === index) {
      this.setState({
        selectedIndex: '',
        selectCard: '',
      });
    } else {
      this.setState({
        selectedIndex: index,
        selectCard: 'importLedger',
      });
    }

    if (linkSelected !== link) {
      selectLink = link;
      return this.setState({
        linkSelected: selectLink,
      });
    }
    return this.setState({
      linkSelected: selectLink,
    });
  };

  onClickSelect = select => {
    const { selectCard } = this.state;
    let selectd = select;

    if (selectCard === select) {
      selectd = '';
    }

    this.setState({
      linkSelected: null,
      selectedIndex: '',
      selectCard: selectd,
    });
  };

  refreshTweetFunc = () => {
    const { refreshTweet } = this.state;
    this.setState({
      refreshTweet: refreshTweet + 1,
    });
  };

  render() {
    const {
      pocket,
      loading,
      addAddress,
      stage,
      returnCode,
      ledgerVersion,
      accounts,
      link,
      importLinkCli,
      selectedIndex,
      linkSelected,
      selectCard,
      balanceEthAccount,
      accountsETH,
      refreshTweet,
    } = this.state;
    const { web3, stageActionBar } = this.props;

    let countLink = 0;
    if (link !== null) {
      countLink = [].concat.apply([], link).length;
    }

    if (loading) {
      return (
        <div
          style={{
            width: '100%',
            height: '50vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Loading />
        </div>
      );
    }

    if (addAddress && stage === STAGE_INIT) {
      return (
        <div>
          <main className="block-body-home">
            <Pane
              boxShadow="0px 0px 5px #36d6ae"
              paddingX={20}
              paddingY={20}
              marginY={20}
              marginX="auto"
              width="60%"
            >
              <Text fontSize="16px" color="#fff">
                This is your pocket. If you give me your pubkey I can help
                cyberlink, track your balances, participate in the{' '}
                <Link to="/gol">Game of Links</Link> and more.
              </Text>
            </Pane>
            <NotFound text=" " />
          </main>
          <ActionBarContainer
            addAddress={addAddress}
            updateAddress={this.checkAddressLocalStorage}
          />
        </div>
      );
    }

    if (!addAddress) {
      return (
        <div>
          <main
            style={{ minHeight: 'calc(100vh - 162px)', alignItems: 'center' }}
            className="block-body"
          >
            <Pane
              width="60%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              height="100%"
            >
              <TweetCard
                refresh={refreshTweet}
                select={selectCard === 'tweet'}
                onClick={() => this.onClickSelect('tweet')}
                account={accounts.cyber.bech32}
                marginBottom={20}
              />
              <PubkeyCard
                onClick={() => this.onClickSelect('pubkey')}
                select={selectCard === 'pubkey'}
                pocket={pocket}
                marginBottom={20}
              />

              {accountsETH === undefined && web3.givenProvider !== null && (
                <PocketCard
                  marginBottom={20}
                  select={selectCard === 'сonnectEth'}
                  onClick={() => this.onClickSelect('сonnectEth')}
                >
                  <Text fontSize="16px" color="#fff">
                    Connect ETH account
                  </Text>
                </PocketCard>
              )}

              {accountsETH !== undefined && web3.givenProvider !== null && (
                <GolBalance
                  balance={balanceEthAccount}
                  accounts={accountsETH}
                  pocket={pocket}
                  marginBottom={20}
                  onClick={() => this.onClickSelect('accountsETH')}
                  select={selectCard === 'accountsETH'}
                />
              )}

              <GolCard
                onClick={() => this.onClickSelect('gol')}
                select={selectCard === 'gol'}
                marginBottom={20}
              />
              {link !== null && (
                <PocketCard
                  marginBottom={20}
                  select={selectCard === 'importCli'}
                  onClick={this.onClickImportLink}
                >
                  <Text fontSize="16px" color="#fff">
                    You have created {link !== null && countLink} cyberlinks in
                    euler-5. Import using CLI
                  </Text>
                </PocketCard>
              )}
              {link !== null && pocket.keys === 'ledger' && (
                <ImportLinkLedger
                  link={link}
                  countLink={countLink}
                  select={selectCard === 'importLedger'}
                  selectedIndex={selectedIndex}
                  selectLink={this.selectLink}
                />
              )}
            </Pane>
          </main>
          {selectCard === 'tweet' ? (
            <ActionBarTweet
              refresh={refreshTweet}
              update={this.refreshTweetFunc}
            />
          ) : (
            <ActionBarContainer
              selectCard={selectCard}
              links={link}
              importLink={importLinkCli}
              addressTable={accounts.cyber.bech32}
              onClickAddressLedger={this.onClickGetAddressLedger}
              addAddress={addAddress}
              linkSelected={linkSelected}
              selectedIndex={selectedIndex}
              updateAddress={this.checkAddressLocalStorage}
              web3={web3}
              accountsETH={accountsETH}
              // onClickSend={}
            />
          )}
        </div>
      );
    }
    return null;
  }
}

const mapDispatchprops = dispatch => {
  return {
    setBandwidthProps: (remained, maxValue) =>
      dispatch(setBandwidth(remained, maxValue)),
  };
};

export default connect(null, mapDispatchprops)(withWeb3(Wallet));
