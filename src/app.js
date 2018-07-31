let data = require('./input.json');
import { Shedule } from './shedule';

start_btn.addEventListener('click', startByClick);

function startByClick() {
    console.log(calculate(data));
}

function calculate(data) {
    try {
        let rates = data.rates;
        let devices = data.devices;
        let maxPower = data.maxPower;
        let shedule = new Shedule(rates, devices, maxPower);
        return shedule.makeExport();
    } catch (e) {
        return e.message;
    }
}



