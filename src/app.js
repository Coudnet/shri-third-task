let data = require('./input.json');

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

class Shedule {
    constructor(rates, devices, maxPower) {
        if (!rates || !devices || !maxPower) throw new Error('Отсутсвуют входные данные. Проеверьте правильность написания json');
        this.createTimingLine(rates);
        this.checkDevices(devices);
    }

    makeExport() {
        let shedule = {};
        this.shedule.forEach((elem, ind) => {
            shedule[ind] = elem.ids;
        });
        return {
            'shedule': shedule,
            'consumedEnergy' : this.consumedEnergy
        }
    }

    createTimingLine(rates) {
        this.shedule = Array(24);
        rates.forEach(rate => {
            if(!rate.from || !rate.to || !rate.value) throw new Error('Неверные входные данные для тарифов. Отсутсвтуют необходимые поля');

            let hour = new HourClass(rate.from);
            while(hour.value !== rate.to) {
                this.shedule[hour.value] = {
                    value: rate.value,
                    ids: []
                };
                hour.inc();
            }

            this.shedule.forEach(hour => {
                if(!hour) throw new Error('Неверные входные данные для тарифов. Отсутсвтует значение диапазона');
            })
        })
    }

    checkDevices(devices) {

        this.consumedEnergy = {
            value: 0,
            devices: {}
        };

        devices.forEach(device => {
            if(!device.id || !device.name || !device.power || !device.duration) throw new Error('Отсутсвуют входные данные. Отсуттстыуют необходимые данные устройства');
            if(!device.mode) device.mode = 'all';
            device.power = device.power / 1000;
            let firstPoint, lastPoint;

            switch(device.mode) {
                case 'day':
                    firstPoint = 7;
                    lastPoint = 20;
                    if(device.duration > 14) throw new Error('Неверные входные данные. Время работы усройства не соответсвтует его периоду дня');
                    break;
                case 'night':
                    firstPoint = 21;
                    lastPoint = 6;
                    if(device.duration > 10) throw new Error('Неверные входные данные. Время работы усройства не соответсвтует его периоду дня');
                    break;
                case 'all':
                    firstPoint = 0;
                    lastPoint = 23;
                    if(device.duration > 24) device.duration = 24;
            }

            let i = new HourClass(firstPoint);
            let endi = new HourClass(lastPoint - (device.duration));
            let j = new HourClass(firstPoint);
            let endj = new HourClass(0);
            let min = {
                start: 0,
                value: Infinity
            };
            let cost = 0;

            do {
                j.value = i.value;
                endj.setVal(i.value + (device.duration));

                if(device.duration === 24) {
                    for(let c = 0; c < 24; c++) {
                        cost += device.power * this.shedule[c].value;
                    }
                } else {
                    while (j.value !== endj.value) {
                        cost += device.power * this.shedule[j.value].value;
                        j.inc();
                    }
                }

                if(cost < min.value) {
                    min.value = cost;
                    min.start = i.value;
                }
                i.inc();

            } while(i.value !== endi.value);

            i.setVal(min.start);
            endi.setVal(min.start + (device.duration));

            if(device.duration === 24) {
                for(let c = 0; c < 24; c++) {
                    this.shedule[c].ids.push(device.id);
                }
            } else {
                while(i.value !== endi.value) {
                    this.shedule[i.value].ids.push(device.id);
                    i.inc();
                }
            }

            this.consumedEnergy.value += min.value;
            this.consumedEnergy.devices[device.id] = min.value;

            device.cost = min.value;
        })
    }
}

class HourClass {
    constructor(num) {
        this.setVal(num);
    }
    inc() {
        if ((this.value + 1) === 24) this.value = 0;
        else this.value++;
    }
    setVal(num) {
        if(num > 23) this.value = num - 24;
        else if(num < 0) this.value = 24 + num;
        else this.value = num;
    }
}