const expect = require('chai').expect;

const RdkafkaStats = require('..');

describe('RdkafkaStats', () => {
	describe('metrics', () => {
		it('indexes metrics by name', () => {
			const stat = new RdkafkaStats({});
			Object.keys(stat.metrics).forEach(metricKey => {
				expect(stat.metrics[metricKey].name).to.be.equal(`rdkafka_${metricKey.toLowerCase()}`);
			});
		});
	});
});
