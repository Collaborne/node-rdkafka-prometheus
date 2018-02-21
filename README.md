# node-rdkafka-prometheus

Helper for exposing node-rdkafka statistics through prometheus

## Usage

```js
const RdkafkaStats = require('node-rdkafka-prometheus');
const prometheus = require('prom-client');

// When setting up a consumer or producer:
const stream = rdkafka.KafkaConsumer.createReadStream({'statistics.interval.ms': 1000});
stream.consumer.on('event.stats', msg => {
  const stats = JSON.parse(msg.message);
  this.metrics.RDKAFKA_STATS.observe(stats);
});
```
