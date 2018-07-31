let data = require('./input.json');
import { Shedule } from './shedule';

start_btn.addEventListener('click', startCalculate);

function startCalculate() {
    try {
        let rates = data.rates;
        let devices = data.devices;
        let maxPower = data.maxPower;
        let time = performance.now();

        let shedule = new Shedule(rates, devices, maxPower);

        time = performance.now() - time;

        console.log(shedule.makeExport());
        console.log(`Время выполнения = ${time}ms`);
    } catch (e) {
        console.log(e.message)
    }
}



