/* eslint-disable max-lines */

const prometheus = require('prom-client');
const logger = require('log4js').getLogger('node-rdkafka-prometheus');

/**
 * @typedef {Object} Options
 * @property {Registry[]} [registers] prometheus registries
 * @property {Object.<string,string>} [extraLabels={}] additional labels to apply to the metrics
 * @property {string} [namePrefix=''] prefix for metric names
 */

/**
 * A "metric" that observes rdkafka statistics
 */
class RdkafkaStats { // eslint-disable-line lines-before-comment
	/**
	 * Create the collector
	 *
	 * @param {Options} options options for the collector
	 */
	constructor(options) {
		const {extraLabels, namePrefix, registers} = Object.assign({
			extraLabels: {},
			namePrefix: '',
			registers: [prometheus.register],
		}, options);

		const globalLabelNames = ['handle', 'type', ...Object.keys(extraLabels)];
		const brokerLabelNames = [...globalLabelNames, 'name', 'nodeid'];
		const topparsLabelNames = [...brokerLabelNames, 'topic'];
		const topicLabelNames = [...globalLabelNames, 'topic'];
		const topicPartitionLabelNames = [...topicLabelNames, 'partition'];
		const cgrpLabelNames = [...globalLabelNames];

		// Note that rdkafka classifies metrics as type 'counter' (or 'int'), but effectively we cannot use
		// prometheus.Counter here, as that only allows incrementing (rightfully). We need a prometheus.Gauge, as we're just
		// reporting whatever rdkafka tells.
		// At the same time all rdkafka 'gauge' metrics could be histograms for us, where we'd record the seen values over time. This would lead to
		// issues in having to define the buckets though, and would make it harder to produce "current" statistics.
		// Abstract this into two functions so it can be looked at later.
		const makeRdKafkaCounter = counterOptions => new prometheus.Gauge(Object.assign(counterOptions, {registers}));
		const makeRdkafkaGauge = gaugeOptions => new prometheus.Gauge(Object.assign(gaugeOptions, {registers}));

		// Disable eslint from complaining about the order: this is based on what rdkafka has in the documentation, so make finding specific statistics faster.
		/* eslint-disable sort-keys */
		this.metrics = {
			// Top-level metrics
			REPLYQ: makeRdkafkaGauge({
				help: 'Number of ops waiting in queue for application to serve with rd_kafka_poll()',
				name: `${namePrefix}rdkafka_replyq`,
				labelNames: globalLabelNames,
			}),
			MSG_CNT: makeRdkafkaGauge({
				help: 'Current number of messages in instance queues',
				name: `${namePrefix}rdkafka_msg_cnt`,
				labelNames: globalLabelNames,
			}),
			MSG_SIZE: makeRdkafkaGauge({
				help: 'Current total size of messages in instance queues',
				name: `${namePrefix}rdkafka_msg_size`,
				labelNames: globalLabelNames,
			}),
			MSG_MAX: makeRdkafkaGauge({
				help: 'Threshold: maximum number of messages allowed',
				name: `${namePrefix}rdkafka_msg_max`,
				labelNames: globalLabelNames,
			}),
			MSG_SIZE_MAX: makeRdkafkaGauge({
				help: 'Threshold: maximum total size of messages allowed',
				name: `${namePrefix}rdkafka_msg_size_max`,
				labelNames: globalLabelNames,
			}),

			// Per-Broker metrics
			BROKER_STATE: makeRdkafkaGauge({
				help: 'Broker state (0 = UP, 1 = DOWN)',
				name: `${namePrefix}rdkafka_broker_state`,
				labelNames: brokerLabelNames,
			}),
			BROKER_STATEAGE: makeRdkafkaGauge({
				help: 'Time since last broker state change (microseconds)',
				name: `${namePrefix}rdkafka_broker_stateage`,
				labelNames: brokerLabelNames,
			}),
			BROKER_OUTBUF_CNT: makeRdkafkaGauge({
				help: 'Number of requests awaiting transmission to broker',
				name: `${namePrefix}rdkafka_broker_outbuf_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_OUTBUF_MSG_CNT: makeRdkafkaGauge({
				help: 'Number of messages in outbuf_cnt',
				name: `${namePrefix}rdkafka_broker_outbuf_msg_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_WAITRESP_CNT: makeRdkafkaGauge({
				help: 'Number of requests in-flight to broker awaiting response',
				name: `${namePrefix}rdkafka_broker_waitresp_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_WAITRESP_MSG_CNT: makeRdkafkaGauge({
				help: 'Number of messages in waitresp_cnt',
				name: `${namePrefix}rdkafka_broker_waitresp_msg_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_TX: makeRdKafkaCounter({
				help: 'Total number of requests sent',
				name: `${namePrefix}rdkafka_broker_tx`,
				labelNames: brokerLabelNames,
			}),
			BROKER_TXBYTES: makeRdKafkaCounter({
				help: 'Total number of bytes sent',
				name: `${namePrefix}rdkafka_broker_txbytes`,
				labelNames: brokerLabelNames,
			}),
			BROKER_TXERRS: makeRdKafkaCounter({
				help: 'Total number of transmissions errors',
				name: `${namePrefix}rdkafka_broker_txerrs`,
				labelNames: brokerLabelNames,
			}),
			BROKER_TXRETRIES: makeRdKafkaCounter({
				help: 'Total number of request retries',
				name: `${namePrefix}rdkafka_broker_txretries`,
				labelNames: brokerLabelNames,
			}),
			BROKER_REQ_TIMEOUTS: makeRdKafkaCounter({
				help: 'Total number of requests timed out',
				name: `${namePrefix}rdkafka_broker_req_timeouts`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RX: makeRdKafkaCounter({
				help: 'Total number of responses received',
				name: `${namePrefix}rdkafka_broker_rx`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RXBYTES: makeRdKafkaCounter({
				help: 'Total number of bytes received',
				name: `${namePrefix}rdkafka_broker_rxbytes`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RXERRS: makeRdKafkaCounter({
				help: 'Total number of receive errors',
				name: `${namePrefix}rdkafka_broker_rxerrs`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RXCORRIDERRS: makeRdKafkaCounter({
				help: 'Total number of unmatched correlation ids in response (typically for timed out requests)',
				name: `${namePrefix}rdkafka_broker_rxcorriderrs`,
				labelNames: brokerLabelNames,
			}),
			BROKER_ZBUF_GROW: makeRdKafkaCounter({
				help: 'Total number of decompression buffer size increases',
				name: `${namePrefix}rdkafka_broker_zbuf_grow`,
				labelNames: brokerLabelNames,
			}),
			BROKER_BUF_GROW: makeRdKafkaCounter({
				help: 'Total number of buffer size increases',
				name: `${namePrefix}rdkafka_broker_buf_grow`,
				labelNames: brokerLabelNames,
			}),
			BROKER_WAKEUPS: makeRdKafkaCounter({
				help: 'Broker thread poll wakeups',
				name: `${namePrefix}rdkafka_broker_wakeups`,
				labelNames: brokerLabelNames,
			}),
			// Window stats: each of (int_latency,rtt,throttle) x (min, max, avg, sum, cnt)
			BROKER_INT_LATENCY_MIN: makeRdkafkaGauge({
				help: 'Internal producer queue latency in microseconds (smallest value)',
				name: `${namePrefix}rdkafka_broker_int_latency_min`,
				labelNames: brokerLabelNames,
			}),
			BROKER_INT_LATENCY_MAX: makeRdkafkaGauge({
				help: 'Internal producer queue latency in microseconds (largest value)',
				name: `${namePrefix}rdkafka_broker_int_latency_max`,
				labelNames: brokerLabelNames,
			}),
			BROKER_INT_LATENCY_AVG: makeRdkafkaGauge({
				help: 'Internal producer queue latency in microseconds (average value)',
				name: `${namePrefix}rdkafka_broker_int_latency_avg`,
				labelNames: brokerLabelNames,
			}),
			BROKER_INT_LATENCY_SUM: makeRdkafkaGauge({
				help: 'Internal producer queue latency in microseconds (sum of values)',
				name: `${namePrefix}rdkafka_broker_int_latency_sum`,
				labelNames: brokerLabelNames,
			}),
			BROKER_INT_LATENCY_CNT: makeRdkafkaGauge({
				help: 'Internal producer queue latency in microseconds (number of value samples)',
				name: `${namePrefix}rdkafka_broker_int_latency_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RTT_MIN: makeRdkafkaGauge({
				help: 'Broker latency / round-trip time in microseconds (smallest value)',
				name: `${namePrefix}rdkafka_broker_rtt_min`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RTT_MAX: makeRdkafkaGauge({
				help: 'Broker latency / round-trip time in microseconds (largest value)',
				name: `${namePrefix}rdkafka_broker_rtt_max`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RTT_AVG: makeRdkafkaGauge({
				help: 'Broker latency / round-trip time in microseconds (average value)',
				name: `${namePrefix}rdkafka_broker_rtt_avg`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RTT_SUM: makeRdkafkaGauge({
				help: 'Broker latency / round-trip time in microseconds (sum of values)',
				name: `${namePrefix}rdkafka_broker_rtt_sum`,
				labelNames: brokerLabelNames,
			}),
			BROKER_RTT_CNT: makeRdkafkaGauge({
				help: 'Broker latency / round-trip time in microseconds (number of value samples)',
				name: `${namePrefix}rdkafka_broker_rtt_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_THROTTLE_MIN: makeRdkafkaGauge({
				help: 'Broker throttling time in milliseconds (smallest value)',
				name: `${namePrefix}rdkafka_broker_throttle_min`,
				labelNames: brokerLabelNames,
			}),
			BROKER_THROTTLE_MAX: makeRdkafkaGauge({
				help: 'Broker throttling time in milliseconds (largest value)',
				name: `${namePrefix}rdkafka_broker_throttle_max`,
				labelNames: brokerLabelNames,
			}),
			BROKER_THROTTLE_AVG: makeRdkafkaGauge({
				help: 'Broker throttling time in milliseconds (average value)',
				name: `${namePrefix}rdkafka_broker_throttle_avg`,
				labelNames: brokerLabelNames,
			}),
			BROKER_THROTTLE_SUM: makeRdkafkaGauge({
				help: 'Broker throttling time in milliseconds (sum of values)',
				name: `${namePrefix}rdkafka_broker_throttle_sum`,
				labelNames: brokerLabelNames,
			}),
			BROKER_THROTTLE_CNT: makeRdkafkaGauge({
				help: 'Broker throttling time in milliseconds (number of value samples)',
				name: `${namePrefix}rdkafka_broker_throttle_cnt`,
				labelNames: brokerLabelNames,
			}),
			BROKER_TOPPARS_PARTITION: makeRdKafkaCounter({
				help: 'Partitions handled by this broker handle',
				name: `${namePrefix}rdkafka_broker_toppars_partition`,
				labelNames: topparsLabelNames,
			}),
			// Per-Topic metrics
			TOPIC_METADATA_AGE: makeRdkafkaGauge({
				help: 'Age of metadata from broker for this topic (milliseconds)',
				name: `${namePrefix}rdkafka_topic_metadata_age`,
				labelNames: topicLabelNames,
			}),
			// Per-Topic-Per-Partition metrics
			TOPIC_PARTITION_LEADER: makeRdkafkaGauge({
				help: 'Current leader broker id',
				name: `${namePrefix}rdkafka_topic_partition_leader`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_DESIRED: makeRdkafkaGauge({
				help: 'Partition is explicitly desired by application (1 = true, 0 = false)',
				name: `${namePrefix}rdkafka_topic_partition_desired`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_UNKNOWN: makeRdkafkaGauge({
				help: 'Partition is not seen in topic metadata from broker (1 = true, 0 = false)',
				name: `${namePrefix}rdkafka_topic_partition_unknown`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_MSGQ_CNT: makeRdkafkaGauge({
				help: 'Number of messages waiting to be produced in first-level queue',
				name: `${namePrefix}rdkafka_topic_partition_msgq_cnt`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_MSGQ_BYTES: makeRdkafkaGauge({
				help: 'Number of bytes in msgq_cnt',
				name: `${namePrefix}rdkafka_topic_partition_msgq_bytes`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_XMIT_MSGQ_CNT: makeRdkafkaGauge({
				help: 'Number of messages ready to be produced in transmit queue',
				name: `${namePrefix}rdkafka_topic_partition_xmit_msgq_cnt`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_XMIT_MSGQ_BYTES: makeRdkafkaGauge({
				help: 'Number of bytes in xmit_msqg',
				name: `${namePrefix}rdkafka_topic_partition_xmit_msgq_bytes`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_FETCHQ_CNT: makeRdkafkaGauge({
				help: 'Number of pre-fetched messages in fetch queue',
				name: `${namePrefix}rdkafka_topic_partition_fetchq_cnt`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_FETCHQ_SIZE: makeRdkafkaGauge({
				help: 'Bytes in fetchq',
				name: `${namePrefix}rdkafka_topic_partition_fetchq_size`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_FETCH_STATE: makeRdkafkaGauge({
				help: 'Consumer fetch state for this partition (0 = none, 1 = active)',
				name: `${namePrefix}rdkafka_topic_partition_fetch_state`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_QUERY_OFFSET: makeRdkafkaGauge({
				help: 'Current/Last logical offset query',
				name: `${namePrefix}rdkafka_topic_partition_query_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_NEXT_OFFSET: makeRdkafkaGauge({
				help: 'Next offset to fetch',
				name: `${namePrefix}rdkafka_topic_partition_next_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_APP_OFFSET: makeRdkafkaGauge({
				help: 'Offset of last message passed to application',
				name: `${namePrefix}rdkafka_topic_partition_app_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_STORED_OFFSET: makeRdkafkaGauge({
				help: 'Offset to be committed',
				name: `${namePrefix}rdkafka_topic_partition_stored_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_COMMITTED_OFFSET: makeRdkafkaGauge({
				help: 'Last committed offset',
				name: `${namePrefix}rdkafka_topic_partition_committed_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_EOF_OFFSET: makeRdkafkaGauge({
				help: 'Last PARTITION_EOF signaled offset',
				name: `${namePrefix}rdkafka_topic_partition_eof_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_LO_OFFSET: makeRdkafkaGauge({
				help: 'Partition\'s low watermark offset on broker',
				name: `${namePrefix}rdkafka_topic_partition_lo_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_HI_OFFSET: makeRdkafkaGauge({
				help: 'Partition\'s high watermark offset on broker',
				name: `${namePrefix}rdkafka_topic_partition_hi_offset`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_CONSUMER_LAG: makeRdkafkaGauge({
				help: 'Difference between hi_offset - app_offset',
				name: `${namePrefix}rdkafka_topic_partition_consumer_lag`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_TXMSGS: makeRdKafkaCounter({
				help: 'Total number of messages transmitted (produced)',
				name: `${namePrefix}rdkafka_topic_partition_txmsgs`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_TXBYTES: makeRdKafkaCounter({
				help: 'Total number of bytes transmitted',
				name: `${namePrefix}rdkafka_topic_partition_txbytes`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_MSGS: makeRdKafkaCounter({
				help: 'Total number of messages received (consumed)',
				name: `${namePrefix}rdkafka_topic_partition_msgs`,
				labelNames: topicPartitionLabelNames,
			}),
			TOPIC_PARTITION_RX_VER_DROPS: makeRdKafkaCounter({
				help: 'Dropped outdated messages',
				name: `${namePrefix}rdkafka_topic_partition_rx_ver_drops`,
				labelNames: topicPartitionLabelNames,
			}),
			// Consumer group metrics
			CGRP_REBALANCE_AGE: makeRdkafkaGauge({
				help: 'Time elapsed since last rebalance (assign or revoke) (milliseconds)',
				name: `${namePrefix}rdkafka_cgrp_rebalance_age`,
				labelNames: cgrpLabelNames,
			}),
			CGRP_REBALANCE_CNT: makeRdkafkaGauge({
				help: 'Total number of rebalances (assign or revoke)',
				name: `${namePrefix}rdkafka_cgrp_rebalance_cnt`,
				labelNames: cgrpLabelNames,
			}),
			CGRP_ASSIGNMENT_SIZE: makeRdkafkaGauge({
				help: 'Current assignment\'s partition count',
				name: `${namePrefix}rdkafka_cgrp_assignment_size`,
				labelNames: cgrpLabelNames,
			}),
		};
		/* eslint-enable sort-keys */
		this.extraLabels = extraLabels;

		/**
		 * Set of names of metrics that were unknown and we have warned the user about.
		 */
		this.warnedUnknownMetrics = new Set();
	}

	_translateRdkafkaStat(key, value, labels, valueMapper = v => v) {
		const metric = this.metrics[key.toUpperCase()];
		if (metric) {
			try {
				const observe = 'observe' in metric ? 'observe' : 'set';
				metric[observe](labels, valueMapper(value));
			} catch (e) {
				// FIXME: prometheus.Counter doesn't have a "set value to", but only a "inc value by".
				logger.warn(`Cannot determine how to observice metric ${metric.name}`);
			}
		} else if (!this.warnedUnknownMetrics.has(key)) {
			this.warnedUnknownMetrics.add(key);
			logger.warn(`Unknown metric ${key} (labels ${JSON.stringify(labels)})`);
		}
	}

	_translateRdKafkaBrokerWindowStats(windowKey, brokerWindowStats, brokerLabels) {
		for (const key of Object.keys(brokerWindowStats)) {
			this._translateRdkafkaStat(`broker_${windowKey}_${key}`, brokerWindowStats[key], brokerLabels);
		}
	}

	_translateRdKafkaBrokerTopparsStats(brokerTopparsStats, brokerLabels) {
		const brokerTopparsLabels = Object.assign({}, brokerLabels, {
			topic: brokerTopparsStats.topic
		});

		for (const key of Object.keys(brokerTopparsStats)) {
			switch (key) {
			case 'topic':
				// Ignore: part of brokerTopparsLabels
				break;
			default:
				this._translateRdkafkaStat(`broker_toppars_${key}`, brokerTopparsStats[key], brokerTopparsLabels);
				break;
			}
		}
	}

	_translateRdkafkaBrokerStats(brokerStats, globalLabels) {
		const brokerLabels = Object.assign({}, globalLabels, {
			name: brokerStats.name,
			nodeid: brokerStats.nodeid
		});

		for (const key of Object.keys(brokerStats)) {
			switch (key) {
			case 'name':
			case 'nodeid':
				// Ignore: these are in brokerLabels already
				break;
			case 'int_latency':
			case 'rtt':
			case 'throttle':
				this._translateRdKafkaBrokerWindowStats(key, brokerStats[key], brokerLabels);
				break;
			case 'toppars':
				for (const topparName of Object.keys(brokerStats[key])) {
					this._translateRdKafkaBrokerTopparsStats(brokerStats[key][topparName], brokerLabels);
				}
				break;
			case 'state':
				this._translateRdkafkaStat(`broker_${key}`, brokerStats[key], brokerLabels, state => {
					switch (state) {
					case 'UP': return 0;
					case 'DOWN': return 1;
					default:
						logger.warn(`Cannot map rdkafka broker state ${state} to prometheus value`);
						return -1;
					}
				});
				break;
			default:
				this._translateRdkafkaStat(`broker_${key}`, brokerStats[key], brokerLabels);
				break;
			}
		}
	}

	_translateRdkafkaTopicPartitionStats(statKey, topicPartitionStats, topicLabels) {
		const topicPartitionLabels = Object.assign({}, topicLabels, {
			partition: topicPartitionStats.partition
		});
		for (const key of Object.keys(topicPartitionStats)) {
			switch (key) {
			case 'partition':
				// Ignore: Part of the topic partition labels
				break;
			case 'desired':
			case 'unknown':
				this._translateRdkafkaStat(`topic_partition_${key}`, topicPartitionStats[key], topicPartitionLabels, state => {
					return state ? 1 : 0;
				});
				break;
			case 'fetch_state':
				this._translateRdkafkaStat(`topic_partition_${key}`, topicPartitionStats[key], topicPartitionLabels, state => {
					switch (state) {
					case 'none': return 0;
					case 'active': return 1;
					default:
						logger.warn(`Cannot map rdkafka topic partition fetch state ${state} to prometheus value`);
						return -1;
					}
				});
				break;
			case 'commited_offset':
				// Ignore: see https://github.com/edenhill/librdkafka/issues/80
				break;
			default:
				this._translateRdkafkaStat(`topic_partition_${key}`, topicPartitionStats[key], topicPartitionLabels);
				break;
			}
		}
	}

	_translateRdkafkaTopicStats(topicStats, globalLabels) {
		const topicLabels = Object.assign({}, globalLabels, {
			topic: topicStats.topic
		});
		for (const key of Object.keys(topicStats)) {
			switch (key) {
			case 'topic':
				// Ignore: Part of the topic labels
				break;
			case 'partitions':
				for (const topicPartitionId of Object.keys(topicStats[key])) {
					this._translateRdkafkaTopicPartitionStats(key, topicStats[key][topicPartitionId], topicLabels);
				}
				break;
			default:
				this._translateRdkafkaStat(`topic_${key}`, topicStats[key], topicLabels);
				break;
			}
		}
	}

	_translateRdkafkaCgrpStats(cgrpStats, globalLabels) {
		const cgrpLabels = Object.assign({}, globalLabels);
		for (const key of Object.keys(cgrpStats)) {
			this._translateRdkafkaStat(`cgrp_${key}`, cgrpStats[key], cgrpLabels);
		}
	}

	_translateRdkafkaStats(stats) {
		const globalLabels = Object.assign({}, this.extraLabels, {
			handle: stats.name,
			type: stats.type
		});
		for (const key of Object.keys(stats)) {
			switch (key) {
			case 'name':
			case 'type':
				// Ignore: these are global labels
				break;
			case 'brokers':
				for (const brokerName of Object.keys(stats[key])) {
					this._translateRdkafkaBrokerStats(stats[key][brokerName], globalLabels);
				}
				break;
			case 'topics':
				for (const topicName of Object.keys(stats[key])) {
					this._translateRdkafkaTopicStats(stats[key][topicName], globalLabels);
				}
				break;
			case 'cgrp':
				this._translateRdkafkaCgrpStats(stats[key], globalLabels);
				break;
			default:
				this._translateRdkafkaStat(key, stats[key], globalLabels);
				break;
			}
		}
	}

	/**
	 * "Observe" the given statistics
	 *
	 * This internally translates the statistics into many prometheus metrics.
	 *
	 * @param {object} stats rdkafka raw statistics
	 * @return {void}
	 */
	observe(stats) {
		this._translateRdkafkaStats(stats);
	}
}

module.exports = RdkafkaStats;
