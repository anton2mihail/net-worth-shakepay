import React, { Component } from 'react';
import { Header, Card, Icon } from 'semantic-ui-react';
import moment from 'moment';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { groupBy, forEach } from 'lodash';

class Dashboard extends Component {
  state = {
    all: [],
    supplementaryTransactions: [],
  };
  componentDidMount = async () => {
    let all, eth_conversion, btc_conversion;
    await fetch(
      'https://shakepay.github.io/programming-exercise/web/transaction_history.json'
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        console.log(json);

        // Might Use As Extra Features
        // let cad = json.filter((el) => el.currency === 'CAD');
        // let btc = json.filter((el) => el.currency === 'BTC');
        // let eth = json.filter((el) => el.currency === 'ETH');

        all = json.sort(this.compareDate);
      });
    await fetch(
      'https://shakepay.github.io/programming-exercise/web/rates_CAD_ETH.json'
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        console.log(json);

        eth_conversion = json;
      });
    await fetch(
      'https://shakepay.github.io/programming-exercise/web/rates_CAD_BTC.json'
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        console.log(json);

        btc_conversion = json;
      });

    let allTransactions = this.convertAll(
      all,
      eth_conversion,
      btc_conversion
    ).filter((el) => el.type !== 'conversion');
    this.setState({
      all: [...allTransactions, ...this.state.supplementaryTransactions].sort(
        this.compareDate
      ),
    });
  };

  findSameDate = (currentDate, conv) => {
    let found = conv.find((el) => {
      let that = el.createdAt;
      return moment(that).isSame(currentDate, 'day');
    });
    if (!found) {
      found = conv.find((el) => {
        let that = el.createdAt;
        return moment(that).diff(currentDate, 'months') <= 4;
      });
    }
    return found;
  };

  compareDate = (a, b) => {
    let da = moment(a);
    let db = moment(b);
    if (da.diff(db) < 0) {
      return -1;
    }
    if (da.diff(db) > 0) {
      return 1;
    }
    // a must be equal to b
    return 0;
  };

  timeSeriesIt = (all) => {
    let timeSeries = [];
    let currentBalance = all.reduce((acc, el) => {
      let next = acc + el.amount;
      timeSeries.push({
        amount: next,
        date: moment(el.createdAt).format('MMM YYYY'),
      });
      return next;
    }, 0);

    return { amounts: timeSeries, currentBalance };
  };

  createSupplementaryTransactions = (
    transaction,
    conversion,
    type,
    reverse,
    rConversion
  ) => {
    let cadFromAmount = transaction.from.amount * conversion.midMarketRate;

    let cadToAmount = transaction.to.amount;

    if (transaction.to.currency === reverse) {
      cadToAmount = transaction.to.amount * rConversion.midMarketRate;
    }
    this.setState({
      supplementaryTransactions: [
        ...this.state.supplementaryTransactions,
        {
          createdAt: transaction.createdAt,
          amount: -cadFromAmount,
          currency: transaction.from.currency,
        },
        {
          createdAt: transaction.createdAt,
          amount: cadToAmount,
          currency: transaction.to.currency,
        },
      ],
    });
  };

  // mergeSameDates = (all) => {
  //   let dates = all.map((el) => {date: moment(el.createdAt).format("MMM YYYY")})
  //   dates = groupBy(dates, (el) => el.date);

  //   forEach(dates, (el, key) => {

  //   })

  //   return all.reduce((acc, el) => {
  //     let newValue
  //   },[]);
  // };

  convertAll = (all, btc_conversion, eth_conversion) => {
    return all.map((transaction) => {
      let cadValue, conversion;
      let currentDate = moment(transaction.createdAt).format('MMM DD YYYY');

      if (transaction.currency === 'BTC') {
        conversion = this.findSameDate(currentDate, btc_conversion);

        cadValue = transaction.amount * conversion.midMarketRate;

        if (transaction.direction === 'debit') cadValue = -cadValue;

        if (transaction.type === 'conversion') {
          this.createSupplementaryTransactions(
            transaction,
            conversion,
            'BTC',
            'ETH',
            eth_conversion
          );
        }
      } else if (transaction.currency === 'ETH') {
        conversion = this.findSameDate(currentDate, eth_conversion);

        cadValue = transaction.amount * conversion.midMarketRate;
        if (transaction.direction === 'debit') cadValue = -cadValue;

        if (transaction.type === 'conversion') {
          this.createSupplementaryTransactions(
            transaction,
            conversion,
            'ETH',
            'BTC',
            this.findSameDate(currentDate, btc_conversion)
          );
        }
      } else {
        cadValue = transaction.amount;
        if (transaction.direction === 'debit') cadValue = -cadValue;

        if (transaction.type === 'conversion') {
          let rConv;
          if (transaction.to.currency === 'BTC') {
            conversion = this.findSameDate(currentDate, btc_conversion);
            rConv = this.findSameDate(currentDate, eth_conversion);
          } else if (transaction.to.currency === 'ETH') {
            conversion = this.findSameDate(currentDate, eth_conversion);
            rConv = this.findSameDate(currentDate, btc_conversion);
          }
          this.createSupplementaryTransactions(
            transaction,
            conversion,
            'CAD',
            transaction.to.currency,
            rConv
          );
        }
      }
      return {
        ...transaction,
        amount: cadValue,
        date: moment(transaction).format('MMM YYYY'),
      };
    });
  };

  customTooltip = ({ active, payload, label }) => {
    if (active) {
      return (
        <div className='custom-tooltip'>
          <p className='label'>On {label}</p>
          <p className='intro'>You Had {payload[0].value} CAD</p>
          <p className='desc'></p>
        </div>
      );
    }

    return null;
  };

  render() {
    return (
      <div>
        <Header as='h2'>My Progress</Header>
        <div className='stat-group'>
          <div className='net-wealth'>
            <Card fluid>
              <Card.Header>Net CAD Balance Over Time</Card.Header>
              <br />
              <LineChart
                width={window.innerWidth - 150}
                height={400}
                data={this.timeSeriesIt(this.state.all).amounts.reverse()}>
                <Line type='monotone' dataKey='amount' stroke='#8884d8' />
                <CartesianGrid stroke='#ccc' />
                <Tooltip content={this.customTooltip} />
                <Legend />
                <XAxis dataKey='date' />
                <YAxis dataKey='amount' />
              </LineChart>
            </Card>
          </div>

          {/* <div className='btc'>
            <Card fluid>
              <Card.Header>BTC Balance Over Time</Card.Header>
              <br />
              <LineChart
                width={window.innerWidth - 200}
                height={400}
                data={
                  this.timeSeriesIt(this.getCleanBtc(this.state.btc)).amounts
                }>
                <Line type='monotone' dataKey='amount' stroke='#8884d8' />
                <CartesianGrid stroke='#ccc' />
                <Tooltip content={this.customTooltip} />
                <Legend />
                <XAxis dataKey='date' />
                <YAxis dataKey='amount' />
              </LineChart>
            </Card>
          </div> */}
        </div>
      </div>
    );
  }
}

export default Dashboard;
