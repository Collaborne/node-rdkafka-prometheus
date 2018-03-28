# node-rdkafka-prometheus [![Build Status](https://travis-ci.org/Collaborne/node-rdkafka-prometheus.svg?branch=master)](https://travis-ci.org/Collaborne/node-rdkafka-prometheus)

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

## License

    This software is licensed under the Apache 2 license, quoted below.

    Copyright 2011-2018 Collaborne B.V. <http://github.com/Collaborne/>

    Licensed under the Apache License, Version 2.0 (the "License"); you may not
    use this file except in compliance with the License. You may obtain a copy of
    the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    License for the specific language governing permissions and limitations under
    the License.
