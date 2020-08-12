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

class Dashboard extends Component {
  state = {
    cad: [],
    btc: [],
    eth: [],
    all: [],
    width: 0,
  };
  componentDidMount() {
    fetch(
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

        this.setState({ all: json.sort(this.compareDate) });
      });
    fetch(
      'https://shakepay.github.io/programming-exercise/web/rates_CAD_ETH.json'
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        console.log(json);

        this.setState({ eth_conversion: json.sort(this.compareDate) });
      });
    fetch(
      'https://shakepay.github.io/programming-exercise/web/rates_CAD_BTC.json'
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        console.log(json);

        this.setState({ btc_conversion: json.sort(this.compareDate) });
      });
  }

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

  timeSeriesIt = (values, type) => {
    let timeSeries = [];
    let currentBalance = values.reduce((acc, el) => {
      let next = acc + el.amount;
      timeSeries.push({
        amount: next,
        date: moment(el.createdAt).format('MMM YYYY'),
      });
      return next;
    }, 0);

    return { type: type, amounts: timeSeries, currentBalance };
  };

  getCleanEth = (eth) => {
    return eth
      .map((el) => {
        let amt = el.amount;
        if (el.direction === 'debit') amt = -amt;
        return {
          ...el,
          amount: amt,
        };
      })
      .sort(this.compareDate);
  };

  getCleanBtc = (btc) => {
    return btc
      .map((el) => {
        let amt = el.amount;
        if (el.direction === 'debit') amt = -amt;
        return {
          ...el,
          amount: amt,
        };
      })
      .sort(this.compareDate);
  };

  getCleanCad = (cad) => {
    return cad
      .map((el) => {
        let amt = el.amount;
        if (el.direction === 'debit') amt = -amt;
        return {
          ...el,
          amount: amt,
        };
      })
      .sort(this.compareDate);
  };
  customTooltip = ({ active, payload, label }) => {
    if (active) {
      return (
        <div className='custom-tooltip'>
          <p className='label'>On {label}</p>
          <p className='intro'>You Had {payload[0].value} </p>
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
                width={window.innerWidth - 200}
                height={400}
                data={
                  this.timeSeriesIt(this.getCleanEth(this.state.eth)).amounts
                }>
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
